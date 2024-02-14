import { Buffer } from 'buffer';
import { ErgoBoxCandidate } from 'ergo-lib-wasm-nodejs';
import * as wasm from 'ergo-lib-wasm-nodejs';

import { ErgoNetwork } from '../ergo/network/ergoNetwork';
import { uint8ArrayToHex } from '../utils/utils';
import { Boxes } from '../ergo/boxes';
import { ErgoUtils } from '../ergo/utils';
import { getConfig } from '../config/config';
import { WatcherDataBase } from '../database/models/watcherModel';
import { TransactionUtils } from '../utils/watcherUtils';
import { TxType } from '../database/entities/txEntity';
import { AddressBalance } from '../ergo/interfaces';
import { ChangeBoxCreationError, NotEnoughFund } from '../errors/errors';
import { DetachWID } from '../transactions/detachWID';
import WinstonLogger from '@rosen-bridge/winston-logger';

const logger = WinstonLogger.getInstance().getLogger(import.meta.url);

export type ApiResponse = {
  response: string | string[];
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
   * List all watcher tokens and check if they are a registered WID token
   * @param wids all registered WIDs
   * @return watcher WID
   */
  static getWID = async (wids: string[]): Promise<string> => {
    if (!Transaction.isSetupCalled)
      throw new Error("The Transaction class setup doesn't called");
    const balance = await ErgoUtils.getWatcherBalance();
    for (const token of balance.tokens) {
      if (wids.includes(token.tokenId)) return token.tokenId;
    }
    return '';
  };

  /**
   * Get required permit count
   */
  getRequiredPermitsCountPerEvent = async () => {
    const configBox = await Transaction.boxes.getRepoConfigBox();
    const R4 = configBox.register_value(4);
    if (R4) {
      const r4Values: string[] = R4.to_js();
      if (r4Values.length > 0) {
        return BigInt(r4Values[0]);
      }
    }
    throw Error('Invalid repo config box');
  };

  /**
   * calculate total permit for current user
   * @returns
   */
  getTotalPermit = async (): Promise<bigint> => {
    const wid = Transaction.watcherWID;
    if (!wid) return 0n;
    try {
      const collateral = await Transaction.watcherDatabase.getCollateralByWid(
        wid
      );
      return collateral.rwtCount;
    } catch (e) {
      logger.warn(`Could not find collateral box for WID [${wid}]`);
      return 0n;
    }
  };

  returnPermitTx = async (
    height: number,
    RWTCount: bigint,
    permitBox: wasm.ErgoBox,
    repoBox: wasm.ErgoBox,
    widBox: wasm.ErgoBox,
    wid: string,
    feeBox: wasm.ErgoBox | undefined
  ): Promise<{ tx: wasm.Transaction; remainingRwt: bigint }> => {
    const R4 = repoBox.register_value(4);
    const R5 = repoBox.register_value(5);
    const R6 = repoBox.register_value(6);

    // This couldn't happen
    if (!R4 || !R5 || !R6) {
      throw Error('one of registers (4, 5, 6) of repo box is not set');
    }

    const users = R4.to_coll_coll_byte();
    const usersCount: Array<string> | undefined = R5.to_i64_str_array();

    const widIndex = users.map((user) => uint8ArrayToHex(user)).indexOf(wid);
    const inputBoxes = [repoBox, permitBox, widBox];
    const totalRwt = BigInt(usersCount[widIndex]);
    const usersOut = [...users];
    const usersCountOut = [...usersCount];
    if (totalRwt === RWTCount) {
      // need to add collateral
      const collateral = await Transaction.getInstance().getCollateral();
      const collateralBoxes =
        await ErgoNetwork.getCoveringErgAndTokenForAddress(
          Transaction.boxes.watcherCollateralContract
            .ergo_tree()
            .to_base16_bytes(),
          collateral.erg,
          { [getConfig().rosen.RSN]: collateral.rsn },
          (box) => {
            if (!box.register_value(4)) {
              logger.debug('Skipping collateral box without wid information');
              return false;
            }
            const collateralWid = Buffer.from(
              box.register_value(4)?.to_js()
            ).toString('hex');
            logger.debug(`Collateral is found for wid: [${collateralWid}]`);
            return collateralWid == wid;
          }
        );
      if (collateralBoxes.boxes.length == 0)
        throw Error('Collateral box for this wid is not found');
      if (!collateralBoxes.covered) throw Error('Collateral is not covered');
      collateralBoxes.boxes.forEach((box) => inputBoxes.push(box));
      usersOut.splice(widIndex, 1);
      usersCountOut.splice(widIndex, 1);
    } else {
      usersCountOut[widIndex] = (
        BigInt(usersCountOut[widIndex]) - RWTCount
      ).toString();
    }
    const outputBoxes: Array<ErgoBoxCandidate> = [];
    // TODO: To be fixed in unlock transaction refactor
    outputBoxes.push(
      await Transaction.boxes.createRepo(
        height,
        (
          BigInt(repoBox.tokens().get(1).amount().as_i64().to_str()) + RWTCount
        ).toString(),
        (
          BigInt(repoBox.tokens().get(2).amount().as_i64().to_str()) - RWTCount
        ).toString(),
        '10',
        new Uint8Array(),
        0
      )
    );
    let burnToken: { [tokenId: string]: bigint } = {};
    const inputRwtCount = BigInt(
      permitBox.tokens().get(0).amount().as_i64().to_str()
    );
    if (RWTCount == totalRwt) {
      // Should burn the wid and no need for any new box
      logger.debug(`Burning the wid token: [${wid}]`);
      burnToken = { [wid]: -1n };
    } else if (inputRwtCount > RWTCount) {
      // Should create a change permit box and a new wid box
      logger.debug(
        `Creating a new wid box and permit with rwtCount= [${
          inputRwtCount - RWTCount
        }]`
      );
      outputBoxes.push(
        await Transaction.boxes.createPermit(
          height,
          inputRwtCount - RWTCount,
          Buffer.from(wid, 'hex')
        )
      );
      // TODO: To be fixed in unlock tx refactor
      outputBoxes.push(
        Transaction.boxes.createWIDBox(
          height,
          wid,
          Transaction.minBoxValue.as_i64().to_str(),
          '1',
          Transaction.userAddressContract
        )
      );
    } else {
      // All tokens should be unlocked and no need to create a new permit box
      // But it already has some permits so needs the wid token
      logger.debug(
        `Creating a new wid box for other permits, all permits in the existing box are returned`
      );
      // TODO: To be fixed in unlock tx refactor
      outputBoxes.push(
        Transaction.boxes.createWIDBox(
          height,
          wid,
          Transaction.minBoxValue.as_i64().to_str(),
          '1',
          Transaction.userAddressContract
        )
      );
    }
    if (feeBox) inputBoxes.push(feeBox);
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
      const existingBoxIds = [widBox.box_id().to_str()];
      if (feeBox) existingBoxIds.push(feeBox.box_id().to_str());
      const userBoxes = await Transaction.boxes.getUserPaymentBox(
        totalErgOut - totalErgIn,
        existingBoxIds
      );
      userBoxes.forEach((box) => inputBoxes.push(box));
    }
    // create change box
    outputBoxes.push(
      this.createChangeBox(
        inputBoxes,
        outputBoxes,
        Transaction.userAddress,
        height,
        burnToken
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
    const burnTokensWasm = new wasm.Tokens();
    Object.entries(burnToken).forEach(([tokenId, amount]) => {
      burnTokensWasm.add(
        new wasm.Token(
          wasm.TokenId.from_str(tokenId),
          wasm.TokenAmount.from_i64(wasm.I64.from_str((-amount).toString()))
        )
      );
    });
    builder.set_token_burn_permit(burnTokensWasm);
    const signedTx = await ErgoUtils.buildTxAndSign(
      builder,
      Transaction.userSecret,
      txInputBoxes
    );
    await Transaction.txUtils.submitTransaction(signedTx, TxType.PERMIT);
    logger.info(
      `Unlock transaction for ${RWTCount} RWT with txId [${signedTx
        .id()
        .to_str()}] submitted to the queue`
    );
    return { tx: signedTx, remainingRwt: totalRwt - RWTCount };
  };

  /**
   * generating returning permit transaction and send it to the network
   * @param RWTCount
   */
  returnPermit = async (RWTCount: bigint): Promise<ApiResponse> => {
    const activePermitTxs =
      await Transaction.watcherDatabase.getActivePermitTransactions();
    if (activePermitTxs.length !== 0) {
      return {
        response: `permit transaction [${activePermitTxs[0].txId}] is in queue`,
        status: 400,
      };
    }

    if (!Transaction.watcherPermitState) {
      return { response: 'No permit found', status: 400 };
    }
    const WID = Transaction.watcherWID!;

    const permitBoxes = await Transaction.boxes.getPermits(WID, RWTCount);
    let repoBox = await Transaction.boxes.getRepoBox();
    // TODO: To be fixed in unlock refactor
    let widBox = (await Transaction.boxes.getWIDBox(WID))[0];
    const height = await ErgoNetwork.getHeight();

    if (widBox.tokens().get(0).id().to_str() != WID) {
      try {
        await DetachWID.detachWIDtx(
          Transaction.txUtils,
          Transaction.boxes,
          WID,
          widBox
        );
        return {
          response: `WID box is not in valid format (WID token is not the first token), please wait for the correction transaction`,
          status: 400,
        };
      } catch (e) {
        return {
          response: `WID box is not in valid format, but an error in creating correction transaction: ${e}`,
          status: 500,
        };
      }
    }
    try {
      let tx: wasm.Transaction,
        remainingRwt = RWTCount,
        remainingUnlock = RWTCount,
        feeBox: wasm.ErgoBox | undefined = undefined;
      const unlockTxIds: Array<string> = [];
      for (const permitBox of permitBoxes) {
        const permitRwt = BigInt(
          permitBox.tokens().get(0).amount().as_i64().to_str()
        );
        const unlockingRwt =
          remainingUnlock > permitRwt ? permitRwt : remainingUnlock;
        logger.debug(
          `Unlocking ${unlockingRwt} locked in permitBox: [${permitBox
            .box_id()
            .to_str()}], using widBox: [${widBox
            .box_id()
            .to_str()}] and repoBox: [${repoBox.box_id().to_str()}]`
        );
        ({ tx, remainingRwt } = await this.returnPermitTx(
          height,
          unlockingRwt,
          permitBox,
          repoBox,
          widBox,
          WID,
          feeBox
        ));
        repoBox = tx.outputs().get(0);
        widBox = tx.outputs().get(1);
        feeBox = tx.outputs().len() > 3 ? tx.outputs().get(2) : undefined;
        remainingUnlock -= unlockingRwt;
        unlockTxIds.push(tx.id().to_str());
      }
      const isAlreadyWatcher = remainingRwt > 0;
      Transaction.watcherUnconfirmedWID = isAlreadyWatcher
        ? Transaction.watcherWID
        : '';
      return {
        response: unlockTxIds,
        status: 200,
      };
    } catch (e) {
      logger.warn(`Unlock operation exited incomplete by error: ${e.message}`);
      if (e instanceof NotEnoughFund) {
        return {
          response: `Not enough ERG to complete the unlock operation`,
          status: 400,
        };
      } else {
        return {
          response: e.message,
          status: 500,
        };
      }
    }
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
   * @param burnTokens: array of tokens to burn. amount must be negative for burning
   */
  private createChangeBox = (
    inBoxes: Array<wasm.ErgoBox>,
    outBoxes: Array<wasm.ErgoBoxCandidate>,
    address: wasm.Address,
    height: number,
    burnTokens: { [tokenId: string]: bigint } = {}
  ) => {
    const totalTokens: { [tokenId: string]: bigint } = { ...burnTokens };
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
   * get Erg and RSN collateral
   * CAUTION: this function removed in watcher refactor
   */
  getCollateral = async () => {
    const configBox = await Transaction.boxes.getRepoConfigBox();
    const R4 = configBox.register_value(4);
    if (R4) {
      const r4Values: string[] = R4.to_js();
      if (r4Values.length > 0) {
        return { erg: BigInt(r4Values[4]), rsn: BigInt(r4Values[5]) };
      }
    }
    throw Error('Invalid repo config box');
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
        status: 400,
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
    const collateral = await this.getCollateral();
    const ErgCollateral = collateral.erg;
    const RSNCollateral = collateral.rsn;

    const inputBoxes = [repoBox];
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
    if (!userBoxes.covered) {
      return {
        response: `Not enough ERG or RSN. Required [${RequiredErg}] ERG and [${RequiredRSN}] RSN`,
        status: 400,
      };
    }
    if (WID) {
      // TODO: To be fixed in lock refactor
      const widBox = (await Transaction.boxes.getWIDBox(WID))[0];
      if (widBox.tokens().get(0).id().to_str() != WID) {
        await DetachWID.detachWIDtx(
          Transaction.txUtils,
          Transaction.boxes,
          WID,
          widBox
        );
        return {
          response: `WID box is not in valid format (WID token is not the first token), please wait for the correction transaction`,
          status: 400,
        };
      }
      inputBoxes.push(widBox);
      userBoxes.boxes.forEach((box) => {
        if (box.box_id().to_str() != widBox.box_id().to_str())
          inputBoxes.push(box);
      });
    } else inputBoxes.push(...userBoxes.boxes);

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
    // TODO: To be fixed in lock transaction refactor
    outBoxes.push(
      await Transaction.boxes.createRepo(
        height,
        RepoRWTCount.to_str(),
        RSNTokenCount.to_str(),
        '10',
        new Uint8Array(),
        0
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
        '1',
        wasm.Contract.pay_to_address(Transaction.userAddress),
        !WID
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
      const allWids = await Transaction.watcherDatabase.getAllWids();
      logger.debug(`All registered wids are ${allWids}`);
      Transaction.watcherWID = await Transaction.getWID(allWids);
      logger.info(`Watcher WID is set to: ${Transaction.watcherWID}`);
      Transaction.watcherPermitState = Transaction.watcherWID !== '';
    }
  };

  /**
   * Withdraw from the wallet of the watcher
   * @param amount to withdraw
   * @param toAddress destination address
   * @returns txId
   */
  withdrawFromWallet = async (
    amount: AddressBalance,
    toAddress: string
  ): Promise<string> => {
    const config = getConfig();
    const fee = BigInt(config.general.fee);
    const minBoxValue = BigInt(config.general.minBoxValue);
    const assetsMap = new Map<string, bigint>();
    amount.tokens.forEach((token) => {
      assetsMap.set(token.tokenId, token.amount);
    });

    try {
      const coveringBoxes = await Transaction.boxes.getCoveringBoxes(
        amount.nanoErgs + fee + minBoxValue,
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
        {
          nanoErgs:
            amount.nanoErgs > minBoxValue ? amount.nanoErgs : minBoxValue,
          tokens: [...amount.tokens],
        },
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
      return signed.id().to_str();
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
