import { ErgoNetwork } from '../ergo/network/ergoNetwork';
import * as wasm from 'ergo-lib-wasm-nodejs';
import { hexStrToUint8Array, uint8ArrayToHex } from '../utils/utils';
import { Boxes } from '../ergo/boxes';
import { ErgoUtils } from '../ergo/utils';
import { loggerFactory } from '../log/Logger';
import { getConfig } from '../config/config';
import { AddressBalance } from '../ergo/interfaces';
import { TxType } from '../database/entities/txEntity';
import { ChangeBoxCreationError, NotEnoughFund } from '../errors/errors';
import { TransactionUtils } from '../utils/watcherUtils';

const logger = loggerFactory(import.meta.url);

export type ApiResponse = {
  response: string;
  status: number;
};

/**
 * Transaction class used by watcher to generate transaction for ergo network
 */
export class Transaction {
  protected static instance: Transaction | undefined;
  protected static isSetupCalled = false;
  static watcherPermitState?: boolean;
  static watcherWID?: string;
  static boxes: Boxes;
  static txUtils: TransactionUtils;
  static minBoxValue: wasm.BoxValue;
  static fee: wasm.BoxValue;
  static userSecret: wasm.SecretKey;
  static userAddress: wasm.Address;
  static userAddressContract: wasm.Contract;
  static RSN: wasm.TokenId;

  /**
   * setup function to set up the singleton class before getting instance
   * @param userAddress
   * @param userSecret
   * @param boxes
   * @param txUtils
   */
  static setup = async (
    userAddress: string,
    userSecret: wasm.SecretKey,
    boxes: Boxes,
    txUtils: TransactionUtils
  ) => {
    if (!Transaction.isSetupCalled) {
      Transaction.watcherPermitState = undefined;
      Transaction.watcherWID = '';
      Transaction.boxes = boxes;
      Transaction.txUtils = txUtils;
      Transaction.fee = wasm.BoxValue.from_i64(
        wasm.I64.from_str(getConfig().general.fee)
      );
      Transaction.minBoxValue = wasm.BoxValue.from_i64(
        wasm.I64.from_str(getConfig().general.minBoxValue)
      );
      Transaction.userSecret = userSecret;
      Transaction.userAddress = wasm.Address.from_base58(userAddress);
      Transaction.RSN = wasm.TokenId.from_str(getConfig().rosen.RSN);
      Transaction.userAddressContract = wasm.Contract.pay_to_address(
        this.userAddress
      );
      Transaction.isSetupCalled = true;
      await Transaction.getWatcherState();
    }
  };

  /**
   * Getting singleton instance of the class
   */
  static getInstance = () => {
    if (!Transaction.instance) {
      if (Transaction.isSetupCalled) Transaction.instance = new Transaction();
      else throw new Error("Setup doesn't called for Transaction");
    }
    return Transaction.instance;
  };

  /**
   * it gets repoBox users list and find the corresponding wid to the watcher and
   *  returns it's wid or in case of no permits return empty string
   * @param users
   */
  static getWID = async (users: Array<Uint8Array>): Promise<string> => {
    // TODO: This function hasn't good performance
    if (!Transaction.isSetupCalled)
      throw new Error("The Transaction class setup doesn't called");
    const usersWID = users.map(async (id) => {
      const wid = uint8ArrayToHex(id);
      try {
        await ErgoNetwork.getBoxWithToken(Transaction.userAddress, wid);
        return true;
      } catch (error) {
        return false;
      }
    });
    for (const [i, userWID] of usersWID.entries()) {
      if (await userWID) {
        return uint8ArrayToHex(users[i]);
      }
    }
    return '';
  };

  /**
   * generating returning permit transaction and send it to the network
   * @param RWTCount
   */
  returnPermit = async (RWTCount: bigint): Promise<ApiResponse> => {
    if (!Transaction.watcherPermitState) {
      return { response: "you don't have permit box", status: 500 };
    }
    const WID = Transaction.watcherWID!;
    const height = await ErgoNetwork.getHeight();

    const permitBoxes = await Transaction.boxes.getPermits(WID, RWTCount);
    const repoBox = await Transaction.boxes.getRepoBox();
    const R4 = repoBox.register_value(4);
    const R5 = repoBox.register_value(5);
    const R6 = repoBox.register_value(6);

    // This couldn't happen
    if (!R4 || !R5 || !R6) {
      return {
        response: 'one of registers (4, 5, 6) of repo box is not set',
        status: 500,
      };
    }

    const users = R4.to_coll_coll_byte();

    const widBox = await ErgoNetwork.getBoxWithToken(
      Transaction.userAddress,
      WID
    );

    const usersCount: Array<string> | undefined = R5.to_i64_str_array();

    const widIndex = users.map((user) => uint8ArrayToHex(user)).indexOf(WID);
    const inputRWTCount = BigInt(usersCount[widIndex]);
    let newUsers = users;
    let newUsersCount = usersCount;
    let needOutputPermitBox = false;
    if (inputRWTCount == RWTCount) {
      newUsers = users
        .slice(0, widIndex)
        .concat(users.slice(widIndex + 1, users.length));
      newUsersCount = usersCount
        .slice(0, widIndex)
        .concat(usersCount.slice(widIndex + 1, usersCount.length));
    } else if (inputRWTCount > RWTCount) {
      newUsersCount[widIndex] = (inputRWTCount - RWTCount).toString();
      needOutputPermitBox = true;
    } else {
      return {
        response: "You don't have enough RWT locked to extract from repo box",
        status: 500,
      };
    }
    const RepoRWTCount = repoBox
      .tokens()
      .get(1)
      .amount()
      .as_i64()
      .checked_add(wasm.I64.from_str(RWTCount.toString()));
    const RSNRWTRatio = R6.to_i64_str_array()[0];
    const RSNTokenCount = repoBox
      .tokens()
      .get(2)
      .amount()
      .as_i64()
      .checked_add(
        wasm.I64.from_str((RWTCount * -BigInt(RSNRWTRatio)).toString())
      );

    const repoOut = await Transaction.boxes.createRepo(
      height,
      RepoRWTCount.to_str(),
      RSNTokenCount.to_str(),
      newUsers,
      newUsersCount,
      R6,
      widIndex
    );

    const inputBoxes = new wasm.ErgoBoxes(repoBox);
    permitBoxes.forEach((box) => inputBoxes.add(box));
    inputBoxes.add(widBox);

    const inputBoxSelection = new wasm.BoxSelection(
      inputBoxes,
      new wasm.ErgoBoxAssetsDataList()
    );
    const changeTokens = this.inputBoxesTokenMap(inputBoxes, 2);

    let rsnCount = changeTokens.get(Transaction.RSN.to_str());
    if (rsnCount === undefined) {
      rsnCount = '0';
    } else {
      changeTokens.delete(Transaction.RSN.to_str());
    }

    const repoValue = BigInt(repoBox.value().as_i64().to_str());
    const permitValue = permitBoxes
      .map((permit) => BigInt(permit.value().as_i64().to_str()))
      .reduce((a, b) => a + b, 0n);
    const widValue = BigInt(widBox.value().as_i64().to_str());
    const totalInputValue = repoValue + permitValue + widValue;

    const userOutBoxBuilder = new wasm.ErgoBoxCandidateBuilder(
      wasm.BoxValue.from_i64(
        wasm.I64.from_str(
          (
            totalInputValue -
            BigInt(Transaction.fee.as_i64().to_str()) -
            repoValue -
            (needOutputPermitBox ? BigInt('1') : BigInt('0')) *
              BigInt(Transaction.minBoxValue.as_i64().to_str())
          ).toString()
        )
      ),
      Transaction.userAddressContract,
      height
    );

    userOutBoxBuilder.add_token(
      Transaction.RSN,
      wasm.TokenAmount.from_i64(
        wasm.I64.from_str(
          (RWTCount * BigInt(RSNRWTRatio) + BigInt(rsnCount)).toString()
        )
      )
    );

    for (const [tokenId, tokenAmount] of changeTokens) {
      if (tokenAmount !== '0') {
        userOutBoxBuilder.add_token(
          wasm.TokenId.from_str(tokenId),
          wasm.TokenAmount.from_i64(wasm.I64.from_str(tokenAmount))
        );
      }
    }
    const userOutBox = userOutBoxBuilder.build();
    const outputBoxes = new wasm.ErgoBoxCandidates(repoOut);
    const permitsRWTCount: bigint = permitBoxes
      .map((permit) =>
        BigInt(permit.tokens().get(0).amount().as_i64().to_str())
      )
      .reduce((a, b) => a + b, BigInt(0));
    if (permitsRWTCount > RWTCount) {
      const permitOut = Transaction.boxes.createPermit(
        height,
        permitsRWTCount - RWTCount,
        hexStrToUint8Array(WID)
      );
      outputBoxes.add(permitOut);
    }
    outputBoxes.add(userOutBox);

    const builder = wasm.TxBuilder.new(
      inputBoxSelection,
      outputBoxes,
      height,
      Transaction.fee,
      Transaction.userAddress
    );

    const signedTx = await ErgoUtils.buildTxAndSign(
      builder,
      Transaction.userSecret,
      inputBoxes
    );
    await ErgoNetwork.sendTx(signedTx.to_json());
    Transaction.watcherPermitState = !Transaction.watcherPermitState;
    Transaction.watcherWID = '';
    return { response: signedTx.id().to_str(), status: 200 };
  };

  /**
   * generate a map of tokenId and amount from inputBoxes list with offset set to 0
   *  by default
   * @param inputBoxes
   * @param offset
   */
  inputBoxesTokenMap = (
    inputBoxes: wasm.ErgoBoxes,
    offset = 0
  ): Map<string, string> => {
    const changeTokens = new Map<string, string>();
    for (let i = offset; i < inputBoxes.len(); i++) {
      const boxTokens = inputBoxes.get(i).tokens();
      for (let j = 0; j < boxTokens.len(); j++) {
        const token = boxTokens.get(j);
        const tokenId = token.id().to_str();
        const tokenAmount = token.amount().as_i64();
        if (changeTokens.get(tokenId) !== undefined) {
          tokenAmount.checked_add(token.amount().as_i64());
        }
        changeTokens.set(tokenId, tokenAmount.to_str());
      }
    }
    return changeTokens;
  };

  /**
   * getting watcher permit transaction
   * @param RSNCount
   */
  getPermit = async (RSNCount: bigint): Promise<ApiResponse> => {
    if (Transaction.watcherPermitState) {
      return { response: "you don't have locked any RSN", status: 500 };
    }
    const height = await ErgoNetwork.getHeight();
    const repoBox = await Transaction.boxes.getRepoBox();
    const R4 = repoBox.register_value(4);
    const R5 = repoBox.register_value(5);
    const R6 = repoBox.register_value(6);

    // This couldn't happen
    if (!R4 || !R5 || !R6) {
      return {
        response: 'one of registers (4, 5, 6) of repo box is not set',
        status: 500,
      };
    }

    const RSNRWTRation = R6.to_i64_str_array()[0];

    const RWTCount = RSNCount / BigInt(R6.to_i64_str_array()[0]);
    const RSNInput = await ErgoNetwork.getBoxWithToken(
      Transaction.userAddress,
      Transaction.RSN.to_str()
    );
    const users: Array<Uint8Array> = R4.to_coll_coll_byte();
    const repoBoxId = repoBox.box_id().as_bytes();
    users.push(repoBoxId);
    const usersCount: Array<string> = R5.to_i64_str_array();

    const count = RWTCount.toString();
    usersCount.push(count);

    const RepoRWTCount = repoBox
      .tokens()
      .get(1)
      .amount()
      .as_i64()
      .checked_add(wasm.I64.from_str((RWTCount * BigInt('-1')).toString()));
    const RSNTokenCount = repoBox
      .tokens()
      .get(2)
      .amount()
      .as_i64()
      .checked_add(
        wasm.I64.from_str((RWTCount * BigInt(RSNRWTRation)).toString())
      );
    const repoOut = await Transaction.boxes.createRepo(
      height,
      RepoRWTCount.to_str(),
      RSNTokenCount.to_str(),
      users,
      usersCount,
      R6
    );

    const permitOut = await Transaction.boxes.createPermit(
      height,
      RWTCount,
      repoBox.box_id().as_bytes()
    );
    const WIDToken = wasm.TokenId.from_str(repoBox.box_id().to_str());
    const WIDTokenAmount = wasm.TokenAmount.from_i64(wasm.I64.from_str('1'));
    const inputBoxes = new wasm.ErgoBoxes(repoBox);
    inputBoxes.add(RSNInput);

    const repoValue = repoBox.value();
    const permitValue = RSNInput.value();
    const preTotalInputValue = BigInt(
      repoValue.as_i64().checked_add(permitValue.as_i64()).to_str()
    );
    const outputValue =
      BigInt(Transaction.minBoxValue.as_i64().to_str()) * BigInt('3');
    if (!(preTotalInputValue >= outputValue)) {
      try {
        const boxes = await ErgoNetwork.getErgBox(
          Transaction.userAddress,
          outputValue - preTotalInputValue,
          (box) => {
            return box.box_id().to_str() !== RSNInput.box_id().to_str();
          }
        );
        boxes.forEach((box) => inputBoxes.add(box));
      } catch {
        return {
          response: "You don't have enough Erg to make the transaction",
          status: 500,
        };
      }
    }

    let totalInputValue = wasm.I64.from_str('0');
    for (let i = 0; i < inputBoxes.len(); i++) {
      totalInputValue = totalInputValue.checked_add(
        inputBoxes.get(i).value().as_i64()
      );
    }

    const changeTokens = this.inputBoxesTokenMap(inputBoxes, 1);

    const rsnCount = changeTokens.get(Transaction.RSN.to_str());
    if (rsnCount === undefined) {
      return { response: "You don't have enough RSN", status: 500 };
    }

    const RSNChangeAmount = BigInt(rsnCount) - RSNCount;
    if (RSNChangeAmount < 0) {
      return { response: "You don't have enough RSN", status: 500 };
    }

    RSNChangeAmount !== 0n
      ? changeTokens.set(Transaction.RSN.to_str(), RSNChangeAmount.toString())
      : changeTokens.delete(Transaction.RSN.to_str());

    const changeBoxValue = (
      BigInt(totalInputValue.to_str()) - outputValue
    ).toString();

    const userOut = await Transaction.boxes.createUserBoxCandidate(
      height,
      Transaction.userAddress.to_base58(getConfig().general.networkPrefix),
      changeBoxValue,
      WIDToken,
      WIDTokenAmount,
      changeTokens
    );

    const inputBoxSelection = new wasm.BoxSelection(
      inputBoxes,
      new wasm.ErgoBoxAssetsDataList()
    );
    const outputBoxes = new wasm.ErgoBoxCandidates(repoOut);
    outputBoxes.add(permitOut);
    outputBoxes.add(userOut);

    const builder = wasm.TxBuilder.new(
      inputBoxSelection,
      outputBoxes,
      height,
      Transaction.fee,
      Transaction.userAddress
    );

    const signedTx = await ErgoUtils.buildTxAndSign(
      builder,
      Transaction.userSecret,
      inputBoxes
    );
    await ErgoNetwork.sendTx(signedTx.to_json());
    Transaction.watcherPermitState = !Transaction.watcherPermitState;
    Transaction.watcherWID = WIDToken.to_str();
    return { response: signedTx.id().to_str(), status: 200 };
  };

  /**
   * updating watcher state(permitState and WID if exist)
   */
  static getWatcherState = async () => {
    if (!Transaction.isSetupCalled)
      throw new Error("The Transaction class setup doesn't called");
    logger.info('Getting watcher status');
    if (Transaction.watcherPermitState === undefined) {
      const repoBox = await Transaction.boxes.getRepoBox();
      const R4 = repoBox.register_value(4);
      logger.info(`Repo box id is: ${repoBox.box_id().to_str()}`);
      if (R4) {
        const users = R4.to_coll_coll_byte();
        Transaction.watcherWID = await Transaction.getWID(users);
        logger.info(`Watcher WID is set to: ${Transaction.watcherWID}`);
        Transaction.watcherPermitState = Transaction.watcherWID !== '';
      }
    }
  };

  /**
   * Withdraw from the wallet of the watcher
   * @param amount to withdraw
   * @param toAddress destination address
   */
  withdrawFromWallet = async (amount: AddressBalance, toAddress: string) => {
    const assetsMap = new Map<string, bigint>();
    amount.tokens.forEach((token) => {
      assetsMap.set(token.tokenId, token.amount);
    });

    try {
      const coveringBoxes = await Transaction.boxes.getCoveringBoxes(
        amount.nanoErgs,
        assetsMap
      );
      const height = await ErgoNetwork.getHeight();
      const address = wasm.Address.from_base58(toAddress);

      // create input boxes
      const inputBoxes = new wasm.ErgoBoxes(coveringBoxes[0]);
      for (let i = 1; i < coveringBoxes.length; i++) {
        inputBoxes.add(coveringBoxes[i]);
      }

      // create output box
      const userBox = Transaction.boxes.createCustomBox(
        wasm.Contract.pay_to_address(address),
        amount,
        height
      );
      const candidates = [userBox];

      // create transaction
      const signed = await ErgoUtils.createAndSignTx(
        getConfig().general.secretKey,
        inputBoxes,
        candidates,
        height
      );
      await Transaction.txUtils.submitTransaction(signed, TxType.REDEEM);
      logger.info(
        `Withdraw tx [${signed.id().to_str()}] submitted to the queue`
      );
    } catch (e) {
      if (e instanceof ChangeBoxCreationError) {
        logger.warn(
          "Transaction input and output doesn't match. Input boxesSample assets must be more or equal to the outputs assets."
        );
      } else if (e instanceof NotEnoughFund) {
        // TODO: Send notification (https://git.ergopool.io/ergo/rosen-bridge/watcher/-/issues/33)
        logger.warn(
          `Transaction build failed due to asset insufficiency in the watcher: ${e.message}`
        );
      } else {
        logger.warn(
          `Failed to withdraw from wallet due to occurred error: ${e.message} - ${e.stack}`
        );
      }
      throw e;
    }
  };
}
