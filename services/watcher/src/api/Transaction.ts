import { output } from '@noble/hashes/_assert';
import { Buffer } from 'buffer';
import * as console from 'console';
import { ErgoBox, ErgoBoxCandidate } from 'ergo-lib-wasm-nodejs';
import { ErgoNetwork } from '../ergo/network/ergoNetwork';
import * as wasm from 'ergo-lib-wasm-nodejs';
import { hexStrToUint8Array, uint8ArrayToHex } from '../utils/utils';
import { Boxes } from '../ergo/boxes';
import { ErgoUtils } from '../ergo/utils';
import { loggerFactory } from '../log/Logger';
import { getConfig } from '../config/config';
import { WatcherDataBase } from '../database/models/watcherModel';
import { TransactionUtils } from '../utils/watcherUtils';
import { TxType } from '../database/entities/txEntity';
import { AddressBalance } from '../ergo/interfaces';
import { ChangeBoxCreationError, NotEnoughFund } from '../errors/errors';

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
  protected static watcherDatabase: WatcherDataBase;
  static watcherPermitState?: boolean;
  static watcherUnconfirmedWID?: string;
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
   * @param db
   */
  static setup = async (
    userAddress: string,
    userSecret: wasm.SecretKey,
    boxes: Boxes,
    db: WatcherDataBase
  ) => {
    if (!Transaction.isSetupCalled) {
      Transaction.watcherPermitState = undefined;
      Transaction.watcherWID = '';
      Transaction.boxes = boxes;
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

      this.watcherDatabase = db;
      this.txUtils = new TransactionUtils(db);
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
    const widBox = await Transaction.boxes.getWIDBox(WID);

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

    const usersCount: Array<string> | undefined = R5.to_i64_str_array();

    const widIndex = users.map((user) => uint8ArrayToHex(user)).indexOf(WID);
    const inputBoxes = [repoBox, permitBoxes[0], widBox];
    const totalRWT = BigInt(usersCount[widIndex]);
    if (totalRWT === RWTCount) {
      // need to add collateral
      const collateralBoxes =
        await ErgoNetwork.getCoveringErgAndTokenForAddress(
          Transaction.boxes.watcherCollateralContract
            .ergo_tree()
            .to_base16_bytes(),
          BigInt(Transaction.minBoxValue.as_i64().to_str()),
          {},
          (box) =>
            Buffer.from(box.register_value(4)?.to_js()).toString('hex') == WID
        );
      inputBoxes.push(collateralBoxes.boxes[0]);
    }
    const usersOut = [...users];
    const usersCountOut = [...usersCount];
    if (totalRWT === RWTCount) {
      usersOut.splice(widIndex, 1);
      usersCountOut.splice(widIndex, 1);
    } else {
      usersCountOut[widIndex] = (
        BigInt(usersCountOut[widIndex]) - RWTCount
      ).toString();
    }
    const inputRWTCount = permitBoxes
      .map((box) => BigInt(box.tokens().get(0).amount().as_i64().to_str()))
      .reduce((a, b) => a + b, 0n);
    permitBoxes.slice(1).forEach((box) => inputBoxes.push(box));
    const outputBoxes: Array<ErgoBoxCandidate> = [];
    outputBoxes.push(
      await Transaction.boxes.createRepo(
        height,
        (
          BigInt(repoBox.tokens().get(1).amount().as_i64().to_str()) + RWTCount
        ).toString(),
        (
          BigInt(repoBox.tokens().get(2).amount().as_i64().to_str()) - RWTCount
        ).toString(),
        usersOut,
        usersCountOut,
        repoBox.register_value(6)!,
        widIndex
      )
    );
    if (inputRWTCount > RWTCount) {
      outputBoxes.push(
        await Transaction.boxes.createPermit(
          height,
          inputRWTCount - RWTCount,
          Buffer.from(WID, 'hex')
        )
      );
    }
    outputBoxes.push(
      Transaction.boxes.createWIDBox(
        height,
        WID,
        Transaction.minBoxValue.as_i64().to_str(),
        Transaction.userAddressContract
      )
    );
    const totalErgIn = inputBoxes
      .map((item) => BigInt(item.value().as_i64().to_str()))
      .reduce((a, b) => a + b, 0n);
    const totalErgOut =
      outputBoxes
        .map((item) => BigInt(item.value().as_i64().to_str()))
        .reduce((a, b) => a + b, 0n) +
      BigInt(Transaction.fee.as_i64().to_str()) +
      BigInt(Transaction.minBoxValue.as_i64().to_str());
    if (totalErgOut > totalErgIn) {
      const userBoxes = await ErgoNetwork.getCoveringErgAndTokenForAddress(
        Transaction.userAddressContract.ergo_tree().to_base16_bytes(),
        totalErgOut - totalErgIn
      );
      if (!userBoxes.covered) {
        return {
          response: `Not enough erg. required [${
            totalErgOut - totalErgIn
          }] more Ergs`,
          status: 500,
        };
      }
      userBoxes.boxes.forEach((box) => inputBoxes.push(box));
    }
    // create change box
    outputBoxes.push(
      this.createChangeBox(
        inputBoxes,
        outputBoxes,
        Transaction.userAddress,
        height
      )
    );
    const txInputBoxes = wasm.ErgoBoxes.empty();
    inputBoxes.forEach((box) => {
      txInputBoxes.add(box);
    });

    const inputBoxSelection = new wasm.BoxSelection(
      txInputBoxes,
      new wasm.ErgoBoxAssetsDataList()
    );

    const txOutputBoxes = wasm.ErgoBoxCandidates.empty();
    outputBoxes.forEach((box) => txOutputBoxes.add(box));

    const builder = wasm.TxBuilder.new(
      inputBoxSelection,
      txOutputBoxes,
      height,
      Transaction.fee,
      Transaction.userAddress
    );
    const signedTx = await ErgoUtils.buildTxAndSign(
      builder,
      Transaction.userSecret,
      txInputBoxes
    );
    await Transaction.txUtils.submitTransaction(signedTx, TxType.PERMIT);
    const isAlreadyWatcher = totalRWT > RWTCount;
    Transaction.watcherUnconfirmedWID = isAlreadyWatcher
      ? Transaction.watcherWID
      : '';
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
   * get all input and output boxes and create a box contain all remaining erg and tokens to it.
   * subtract fee amount from ergs and send to selected address
   * @param inBoxes
   * @param outBoxes
   * @param address
   * @param height
   */
  private createChangeBox = (
    inBoxes: Array<wasm.ErgoBox>,
    outBoxes: Array<wasm.ErgoBoxCandidate>,
    address: wasm.Address,
    height: number
  ) => {
    const totalTokens: { [tokenId: string]: bigint } = {};
    let totalErg = 0n;
    inBoxes.forEach((item) => {
      totalErg += BigInt(item.value().as_i64().to_str());
      for (let tokenIndex = 0; tokenIndex < item.tokens().len(); tokenIndex++) {
        const token = item.tokens().get(tokenIndex);
        if (
          Object.prototype.hasOwnProperty.call(totalTokens, token.id().to_str())
        ) {
          totalTokens[token.id().to_str()] += BigInt(
            token.amount().as_i64().to_str()
          );
        } else {
          totalTokens[token.id().to_str()] = BigInt(
            token.amount().as_i64().to_str()
          );
        }
      }
    });
    outBoxes.forEach((box) => {
      totalErg -= BigInt(box.value().as_i64().to_str());
      for (let tokenIndex = 0; tokenIndex < box.tokens().len(); tokenIndex++) {
        const token = box.tokens().get(tokenIndex);
        if (
          Object.prototype.hasOwnProperty.call(totalTokens, token.id().to_str())
        ) {
          totalTokens[token.id().to_str()] -= BigInt(
            token.amount().as_i64().to_str()
          );
        }
      }
    });
    totalErg -= BigInt(Transaction.fee.as_i64().to_str());
    const changeBuilder = new wasm.ErgoBoxCandidateBuilder(
      wasm.BoxValue.from_i64(wasm.I64.from_str(totalErg.toString())),
      wasm.Contract.pay_to_address(address),
      height
    );
    Object.entries(totalTokens).forEach(([tokenId, tokenAmount]) => {
      if (tokenAmount > 0) {
        changeBuilder.add_token(
          wasm.TokenId.from_str(tokenId),
          wasm.TokenAmount.from_i64(wasm.I64.from_str(tokenAmount.toString()))
        );
      }
    });
    return changeBuilder.build();
  };

  /**
   * getting watcher permit transaction
   * @param RSNCount
   */
  getPermit = async (RSNCount: bigint): Promise<ApiResponse> => {
    const activePermitTxs =
      await Transaction.watcherDatabase.getActivePermitTransactions();
    if (activePermitTxs.length !== 0) {
      return {
        response: `permit transaction [${activePermitTxs[0].txId}] is in queue`,
        status: 500,
      };
    }

    const height = await ErgoNetwork.getHeight();
    const repoBox = await Transaction.boxes.getRepoBox();
    const R4 = repoBox.register_value(4);
    const R5 = repoBox.register_value(5);
    const R6 = repoBox.register_value(6);
    const WID = Transaction.watcherWID;
    // This couldn't happen
    if (!R4 || !R5 || !R6) {
      return {
        response: 'one of registers (4, 5, 6) of repo box is not set',
        status: 500,
      };
    }
    const R6Params = R6.to_js() as Array<string>;
    const ErgCollateral = BigInt(R6Params[4]);
    const RSNCollateral = BigInt(R6Params[5]);

    const inputBoxes = [repoBox];
    if (WID) {
      const widBox = await ErgoNetwork.getBoxWithToken(
        Transaction.userAddress,
        WID
      );
      inputBoxes.push(widBox);
    }
    const RSNTokenId = Transaction.RSN.to_str();
    const MinBoxValue = BigInt(Transaction.minBoxValue.as_i64().to_str());
    const RequiredErg =
      (WID ? 0n : ErgCollateral) +
      BigInt(Transaction.fee.as_i64().to_str()) +
      MinBoxValue +
      MinBoxValue;
    const RequiredRSN = (WID ? 0n : RSNCollateral) + RSNCount;
    const userBoxes = await ErgoNetwork.getCoveringErgAndTokenForAddress(
      Transaction.userAddress.to_ergo_tree().to_base16_bytes(),
      RequiredErg,
      {
        [RSNTokenId]: RequiredRSN,
      }
    );
    if (userBoxes.covered) {
      userBoxes.boxes.forEach((box) => inputBoxes.push(box));
    } else {
      return {
        response: `Not enough ERG or RSN. Required [${RequiredErg}] ERG and [${RequiredRSN}] RSN`,
        status: 500,
      };
    }
    // generate RepoOut
    const RepoRWTCount = repoBox
      .tokens()
      .get(1)
      .amount()
      .as_i64()
      .checked_add(wasm.I64.from_str((RSNCount * BigInt('-1')).toString()));
    const RSNTokenCount = repoBox
      .tokens()
      .get(2)
      .amount()
      .as_i64()
      .checked_add(wasm.I64.from_str(RSNCount.toString()));
    const inUsers: Array<Uint8Array> = R4.to_coll_coll_byte();
    const R7 = WID
      ? inUsers.map((item) => Buffer.from(item).toString('hex')).indexOf(WID)
      : undefined;
    const usersOut = WID
      ? [...inUsers]
      : [...inUsers, repoBox.box_id().as_bytes()];
    const usersCount: Array<string> = R5.to_i64_str_array();
    const usersCountOut = WID
      ? usersCount.map((item, index) =>
          index === R7 ? (BigInt(item) + RSNCount).toString() : item
        )
      : [...usersCount, RSNCount.toString()];

    const outBoxes: Array<wasm.ErgoBoxCandidate> = [];
    outBoxes.push(
      await Transaction.boxes.createRepo(
        height,
        RepoRWTCount.to_str(),
        RSNTokenCount.to_str(),
        usersOut,
        usersCountOut,
        R6,
        R7
      )
    );
    // generate watcherPermit
    outBoxes.push(
      await Transaction.boxes.createPermit(
        height,
        RSNCount,
        WID ? Buffer.from(WID, 'hex') : repoBox.box_id().as_bytes()
      )
    );
    // generate WID box
    outBoxes.push(
      await Transaction.boxes.createWIDBox(
        height,
        WID ? WID : repoBox.box_id().to_str(),
        Transaction.minBoxValue.as_i64().to_str(),
        wasm.Contract.pay_to_address(Transaction.userAddress)
      )
    );
    // generate collateral if required
    if (!WID) {
      outBoxes.push(
        await Transaction.boxes.createCollateralBox(
          {
            nanoErgs: ErgCollateral,
            tokens: [
              {
                tokenId: Transaction.RSN.to_str(),
                amount: RSNCollateral,
              },
            ],
          },
          height,
          repoBox.box_id().to_str()
        )
      );
    }
    outBoxes.push(
      this.createChangeBox(
        inputBoxes,
        outBoxes,
        Transaction.userAddress,
        height
      )
    );
    const inBoxes = wasm.ErgoBoxes.empty();
    inputBoxes.forEach((item) => inBoxes.add(item));
    const inputBoxSelection = new wasm.BoxSelection(
      inBoxes,
      new wasm.ErgoBoxAssetsDataList()
    );
    const outputBoxes = wasm.ErgoBoxCandidates.empty();
    outBoxes.forEach((item) => outputBoxes.add(item));

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
      inBoxes
    );
    await Transaction.txUtils.submitTransaction(signedTx, TxType.PERMIT);
    Transaction.watcherUnconfirmedWID = WID ? WID : repoBox.box_id().to_str();
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
      const inputBoxes = wasm.ErgoBoxes.empty();
      for (let i = 0; i < coveringBoxes.length; i++) {
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