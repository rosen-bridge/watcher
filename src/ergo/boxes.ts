import * as wasm from 'ergo-lib-wasm-nodejs';
import {
  bigintMax,
  boxHaveAsset,
  decodeSerializedBox,
  ErgoUtils,
  extractTokens,
} from './utils';
import {
  bigIntToUint8Array,
  hexStrToUint8Array,
  strToUint8Array,
} from '../utils/utils';
import { WatcherDataBase } from '../database/models/watcherModel';
import { Observation } from '../utils/interfaces';
import { ErgoNetwork } from './network/ergoNetwork';
import { Buffer } from 'buffer';
import { BoxEntity } from '@rosen-bridge/address-extractor';
import { NotEnoughFund, NoWID } from '../errors/errors';
import { getConfig } from '../config/config';
import { AddressBalance } from './interfaces';
import { JsonBI } from './network/parser';
import { DefaultLoggerFactory } from '@rosen-bridge/abstract-logger';
import { blake2b } from 'blakejs';
import { ERGO_CHAIN_NAME } from '../config/constants';

const logger = DefaultLoggerFactory.getInstance().getLogger(import.meta.url);

export class Boxes {
  dataBase: WatcherDataBase;
  repoNFTId: wasm.TokenId;
  repoConfigNFT: wasm.TokenId;
  AWC: wasm.TokenId;
  RWTTokenId: wasm.TokenId;
  RSN: wasm.TokenId;
  watcherPermitContract: wasm.Contract;
  minBoxValue: wasm.BoxValue;
  fee: wasm.BoxValue;
  userAddressContract: wasm.Contract;
  repoAddressContract: wasm.Contract;
  watcherCollateralContract: wasm.Contract;
  repoAddress: wasm.Address;
  repoConfigAddress: wasm.Address;
  emissionAddress: wasm.Address;
  emissionContract: wasm.Contract;
  emissionNft: wasm.TokenId;

  constructor(db: WatcherDataBase) {
    const rosenConfig = getConfig().rosen;
    this.dataBase = db;
    this.repoNFTId = wasm.TokenId.from_str(rosenConfig.RepoNFT);
    this.RWTTokenId = wasm.TokenId.from_str(rosenConfig.RWTId);
    this.RSN = wasm.TokenId.from_str(rosenConfig.RSN);
    this.AWC = wasm.TokenId.from_str(rosenConfig.AWC);
    this.repoConfigNFT = wasm.TokenId.from_str(rosenConfig.repoConfigNFT);
    const watcherPermitAddress = wasm.Address.from_base58(
      rosenConfig.watcherPermitAddress
    );
    this.watcherPermitContract =
      wasm.Contract.pay_to_address(watcherPermitAddress);
    this.minBoxValue = wasm.BoxValue.from_i64(
      wasm.I64.from_str(getConfig().general.minBoxValue)
    );
    const userAddress = wasm.Address.from_base58(getConfig().general.address);
    this.userAddressContract = wasm.Contract.pay_to_address(userAddress);
    this.repoAddress = wasm.Address.from_base58(rosenConfig.RWTRepoAddress);
    this.repoAddressContract = wasm.Contract.pay_to_address(this.repoAddress);
    this.watcherCollateralContract = wasm.Contract.pay_to_address(
      wasm.Address.from_base58(rosenConfig.watcherCollateralAddress)
    );
    this.repoConfigAddress = wasm.Address.from_base58(
      rosenConfig.repoConfigAddress
    );
    this.fee = wasm.BoxValue.from_i64(
      wasm.I64.from_str(getConfig().general.fee)
    );
    this.emissionAddress = wasm.Address.from_base58(
      rosenConfig.emissionAddress
    );
    this.emissionContract = wasm.Contract.pay_to_address(this.emissionAddress);
    this.emissionNft = wasm.TokenId.from_str(rosenConfig.emissionNFT);
  }

  /**
   * Returns unique boxes after tracking the spent boxes in the queue
   * @param boxes boxes needed to be tracked in the transaction queue
   * @param token
   */
  uniqueTrackedBoxes = async (
    boxes: Array<wasm.ErgoBox>,
    token?: string
  ): Promise<Array<wasm.ErgoBox>> => {
    const allIds: string[] = [];
    const uniqueBoxes: wasm.ErgoBox[] = [];
    for (const box of boxes) {
      const newPermit = await this.dataBase.trackTxQueue(box, token);
      if (!allIds.includes(newPermit.box_id().to_str())) {
        uniqueBoxes.push(newPermit);
        allIds.push(newPermit.box_id().to_str());
      }
    }
    return uniqueBoxes;
  };

  /**
   * Returns unspent permits covering the RWTCount (Considering the mempool)
   * @param wid
   * @param RWTCount
   */
  getPermits = async (
    wid: string,
    RWTCount?: bigint
  ): Promise<Array<wasm.ErgoBox>> => {
    const permits = (await this.dataBase.getUnspentPermitBoxes(wid)).map(
      (box) => {
        return decodeSerializedBox(box.boxSerialized);
      }
    );
    if (RWTCount) {
      const selectedBoxes = [];
      let totalRWT = BigInt(0);
      for (const box of permits) {
        let unspentBox = await ErgoNetwork.trackMemPool(
          box,
          getConfig().rosen.RWTId
        );
        if (unspentBox)
          unspentBox = await this.dataBase.trackTxQueue(
            unspentBox,
            getConfig().rosen.RWTId
          );
        if (unspentBox) {
          totalRWT =
            totalRWT +
            BigInt(unspentBox.tokens().get(0).amount().as_i64().to_str());
          selectedBoxes.push(unspentBox);
          if (totalRWT >= RWTCount) break;
        }
      }
      if (totalRWT < RWTCount)
        throw new NotEnoughFund("Watcher doesn't have enough unspent permits");
      return selectedBoxes;
    }
    const permitBoxes = await Promise.all(
      permits.map(async (permit) => {
        return await ErgoNetwork.trackMemPool(permit, getConfig().rosen.RWTId);
      })
    );
    return this.uniqueTrackedBoxes(permitBoxes, getConfig().rosen.RWTId);
  };

  /**
   * Returns unspent WID boxes with the specified WID covering the required wid count (Considering the mempool)
   * @param wid
   * @param widCount
   */
  getWIDBox = async (wid?: string, widCount = 1): Promise<wasm.ErgoBox[]> => {
    if (wid) {
      const widBoxes = (await this.dataBase.getUnspentAddressBoxes())
        .map((box: BoxEntity) => {
          return decodeSerializedBox(box.serialized);
        })
        .filter(
          (box: wasm.ErgoBox) =>
            box.tokens().len() > 0 && boxHaveAsset(box, wid)
        );
      let coveredWidCount = 0n;
      const selectedWidBoxes: wasm.ErgoBox[] = [];
      const selectedWidBoxIds: Set<string> = new Set();
      for (const widBox of widBoxes) {
        const trackedWidBox = await this.dataBase.trackTxQueue(
          await ErgoNetwork.trackMemPool(widBox, wid),
          wid
        );
        if (selectedWidBoxIds.has(trackedWidBox.box_id().to_str())) continue;
        selectedWidBoxes.push(trackedWidBox);
        selectedWidBoxIds.add(trackedWidBox.box_id().to_str());
        const widBoxTokens = extractTokens(trackedWidBox.tokens());
        const boxWidCount = widBoxTokens
          .filter((token) => token.id().to_str() == wid)
          .reduce(
            (sum, token) => sum + BigInt(token.amount().as_i64().to_str()),
            0n
          );
        coveredWidCount += boxWidCount;
        if (coveredWidCount >= widCount) break;
      }
      if (coveredWidCount < widCount)
        throw new NoWID(
          'WID box is not found. Cannot sign the transaction. Please check that the scanner to be synced.'
        );
      return selectedWidBoxes;
    } else
      throw new NoWID('Watcher WID is not set. Cannot sign the transaction.');
  };

  /**
   * Returns unspent WID boxes with the specified WID covering the required wid count (Considering the mempool)
   * @param wid
   * @param widCount
   */
  getERsnBoxes = async (eRsnTokenId: string): Promise<wasm.ErgoBox[]> => {
    const boxes = (await this.dataBase.getUnspentAddressBoxes())
      .map((box: BoxEntity) => {
        return decodeSerializedBox(box.serialized);
      })
      .filter(
        (box: wasm.ErgoBox) =>
          box.tokens().len() > 0 && boxHaveAsset(box, eRsnTokenId)
      );
    const selectedBoxes: wasm.ErgoBox[] = [];
    const selectedBoxIds: Set<string> = new Set();
    for (const Box of boxes) {
      const trackedBox = await this.dataBase.trackTxQueue(
        await ErgoNetwork.trackMemPool(Box, eRsnTokenId),
        eRsnTokenId
      );
      if (selectedBoxIds.has(trackedBox.box_id().to_str())) continue;
      selectedBoxes.push(trackedBox);
      selectedBoxIds.add(trackedBox.box_id().to_str());
    }
    return selectedBoxes;
  };

  /**
   * Returns unspent watcher boxes covering the required erg value (Considering the mempool)
   * @param requiredValue
   * @param boxIdsToOmit: a list of box ids to omit
   */
  getUserPaymentBox = async (
    requiredValue: bigint,
    boxIdsToOmit: Array<string> = []
  ): Promise<Array<wasm.ErgoBox>> => {
    const boxes = (await this.dataBase.getUnspentAddressBoxes()).map((box) => {
      return decodeSerializedBox(box.serialized);
    });
    const selectedBoxes: wasm.ErgoBox[] = [];
    let totalValue = BigInt(0);
    for (const box of boxes) {
      let unspentBox = await ErgoNetwork.trackMemPool(box);
      if (unspentBox) unspentBox = await this.dataBase.trackTxQueue(unspentBox);
      if (!unspentBox || boxIdsToOmit.includes(unspentBox.box_id().to_str()))
        continue;
      const isBoxNotSelected = selectedBoxes.every(
        (box) => box.box_id().to_str() !== unspentBox.box_id().to_str()
      );
      if (isBoxNotSelected) {
        totalValue = totalValue + BigInt(unspentBox.value().as_i64().to_str());
        selectedBoxes.push(unspentBox);
        if (totalValue >= requiredValue) break;
      }
    }
    if (totalValue < requiredValue) {
      throw new NotEnoughFund('Not enough fund to create the transaction');
    }
    return selectedBoxes;
  };

  /**
   * Returns unspent boxes covering the required erg and assets (Considering the mempool)
   * @param requiredValue
   * @param requiredAssets
   */
  getCoveringBoxes = async (
    requiredValue: bigint,
    requiredAssets: Map<string, bigint>
  ): Promise<Array<wasm.ErgoBox>> => {
    const boxes = (await this.dataBase.getUnspentAddressBoxes()).map((box) => {
      return decodeSerializedBox(box.serialized);
    });
    const selectedBoxes: wasm.ErgoBox[] = [];
    const uncoveredAssets = new Map<string, bigint>(requiredAssets);
    let uncoveredValue = bigintMax(
      requiredValue,
      BigInt(getConfig().general.minBoxValue)
    );

    const isRequiredRemaining = () => {
      return uncoveredAssets.size > 0 || uncoveredValue > 0n;
    };

    let idx = 0;
    while (isRequiredRemaining() && idx < boxes.length) {
      const box = boxes[idx++];
      let unspentBox = await ErgoNetwork.trackMemPool(box);
      if (unspentBox) unspentBox = await this.dataBase.trackTxQueue(unspentBox);
      const isBoxNotSelected = selectedBoxes.every(
        (box) => box.box_id().to_str() !== unspentBox.box_id().to_str()
      );
      if (unspentBox && isBoxNotSelected) {
        let isUseful = false;
        const boxTokens = unspentBox.tokens();
        for (let i = 0; i < boxTokens.len(); i++) {
          const token = boxTokens.get(i);
          const tokenId = token.id().to_str();
          const tokenAmount = BigInt(token.amount().as_i64().to_str());
          const uncoveredRecord = uncoveredAssets.get(tokenId);
          if (uncoveredRecord) {
            uncoveredAssets.set(tokenId, uncoveredRecord - tokenAmount);
            if (uncoveredAssets.get(tokenId)! <= 0) {
              uncoveredAssets.delete(tokenId);
            }
            isUseful = true;
          }
        }
        if (isUseful || uncoveredValue > 0n) {
          const boxValue = BigInt(unspentBox.value().as_i64().to_str());
          uncoveredValue -=
            uncoveredValue >= boxValue ? boxValue : uncoveredValue;

          selectedBoxes.push(unspentBox);
        }
      }
    }

    if (isRequiredRemaining()) {
      const missingAssets = Array.from(uncoveredAssets.entries()).map(
        ([tokenId, value]) => {
          return { tokenId, value };
        }
      );
      throw new NotEnoughFund(
        `Not enough fund to create the transaction. Uncovered value: ${uncoveredValue}, Uncovered assets: ${JsonBI.stringify(
          missingAssets
        )}`
      );
    }

    return selectedBoxes;
  };

  /**
   * getting repoBox from network with tracking mempool transactions
   */
  getRepoBox = async (): Promise<wasm.ErgoBox> => {
    return await ErgoNetwork.trackMemPool(
      await ErgoNetwork.getBoxWithToken(
        this.repoAddress,
        this.repoNFTId.to_str()
      ),
      this.repoNFTId.to_str()
    );
  };

  /**
   * Return latest repo config box from network with tracking mempool transactions
   */
  getRepoConfigBox = async (): Promise<wasm.ErgoBox> => {
    return await ErgoNetwork.trackMemPool(
      await ErgoNetwork.getBoxWithToken(
        this.repoConfigAddress,
        this.repoConfigNFT.to_str()
      ),
      this.repoConfigNFT.to_str()
    );
  };

  /**
   * Return latest rsn emission box from network with tracking mempool transactions
   */
  getEmissionBox = async (): Promise<wasm.ErgoBox> => {
    return await ErgoNetwork.trackMemPool(
      await ErgoNetwork.getBoxWithToken(
        this.emissionAddress,
        this.emissionNft.to_str()
      ),
      this.emissionNft.to_str()
    );
  };

  /**
   * Return unspent collateral box for the specified WID (Considering the mempool and txQueue)
   * @param wid
   */
  getCollateralBox = async (wid: string): Promise<wasm.ErgoBox> => {
    const collateralEntity = await this.dataBase.getCollateralByWid(wid);
    const collateralBox = decodeSerializedBox(collateralEntity.boxSerialized);
    return await this.dataBase.trackTxQueue(
      await ErgoNetwork.trackMemPool(collateralBox, this.AWC.to_str()),
      this.AWC.to_str()
    );
  };

  /**
   * creates a new permit box with required data
   * @param height
   * @param RWTCount
   * @param WID
   */
  createPermit = (
    height: number,
    RWTCount: bigint,
    WID: Uint8Array
  ): wasm.ErgoBoxCandidate => {
    const builder = new wasm.ErgoBoxCandidateBuilder(
      this.minBoxValue,
      this.watcherPermitContract,
      height
    );
    if (RWTCount > 0) {
      builder.add_token(
        this.RWTTokenId,
        wasm.TokenAmount.from_i64(wasm.I64.from_str(RWTCount.toString()))
      );
    }
    builder.set_register_value(4, wasm.Constant.from_byte_array(WID));
    // The R5 register is needed for commitment redeem transaction
    builder.set_register_value(
      5,
      wasm.Constant.from_coll_coll_byte([Buffer.from('00', 'hex')])
    );
    return builder.build();
  };

  /**
   * creates a new commitment box with the required information on registers
   * @param height
   * @param RWTCount
   * @param WID
   * @param requestId
   * @param eventDigest
   * @param permitScriptHash
   */
  createCommitment = (
    height: number,
    RWTCount: bigint,
    WID: string,
    requestId: string,
    eventDigest: Uint8Array,
    permitScriptHash: Uint8Array
  ): wasm.ErgoBoxCandidate => {
    const contract = wasm.Contract.pay_to_address(
      wasm.Address.from_base58(getConfig().rosen.commitmentAddress)
    );
    const builder = new wasm.ErgoBoxCandidateBuilder(
      this.minBoxValue,
      contract,
      height
    );
    builder.add_token(
      this.RWTTokenId,
      wasm.TokenAmount.from_i64(wasm.I64.from_str(RWTCount.toString()))
    );
    builder.set_register_value(
      4,
      wasm.Constant.from_byte_array(hexStrToUint8Array(WID))
    );
    builder.set_register_value(
      5,
      wasm.Constant.from_byte_array(hexStrToUint8Array(requestId))
    );
    builder.set_register_value(6, wasm.Constant.from_byte_array(eventDigest));
    builder.set_register_value(
      7,
      wasm.Constant.from_byte_array(permitScriptHash)
    );
    return builder.build();
  };

  /**
   * user output box used in getting permit transaction by watcher
   * @param height
   * @param address
   * @param amount
   * @param tokenId issued token for the getting permit transaction
   * @param tokenAmount
   * @param changeTokens other tokens in the input of transaction
   */
  createUserBoxCandidate = async (
    height: number,
    address: string,
    amount: string,
    tokenId: wasm.TokenId,
    tokenAmount: wasm.TokenAmount,
    changeTokens: Map<string, string>
  ) => {
    const userBoxBuilder = new wasm.ErgoBoxCandidateBuilder(
      wasm.BoxValue.from_i64(wasm.I64.from_str(amount)),
      this.userAddressContract,
      height
    );
    userBoxBuilder.add_token(tokenId, tokenAmount);
    for (const [tokenId, tokenAmount] of changeTokens) {
      userBoxBuilder.add_token(
        wasm.TokenId.from_str(tokenId),
        wasm.TokenAmount.from_i64(wasm.I64.from_str(tokenAmount))
      );
    }
    return userBoxBuilder.build();
  };

  /**
   * Creates trigger event box with the aggregated information of WIDs
   * @param value
   * @param height
   * @param WIDs
   * @param observation
   * @param watcherPermitCount
   */
  createTriggerEvent = (
    value: bigint,
    height: number,
    WIDs: Array<string>,
    observation: Observation,
    watcherPermitCount: bigint
  ) => {
    const builder = new wasm.ErgoBoxCandidateBuilder(
      wasm.BoxValue.from_i64(wasm.I64.from_str(value.toString())),
      wasm.Contract.pay_to_address(
        wasm.Address.from_base58(getConfig().rosen.eventTriggerAddress)
      ),
      height
    );
    builder.add_token(
      this.RWTTokenId,
      wasm.TokenAmount.from_i64(
        wasm.I64.from_str(watcherPermitCount.toString())
      )
    );
    const eventData = [
      Buffer.from(observation.sourceTxId),
      Buffer.from(observation.fromChain),
      Buffer.from(observation.toChain),
      Buffer.from(observation.fromAddress),
      Buffer.from(observation.toAddress),
      bigIntToUint8Array(BigInt(observation.amount)),
      bigIntToUint8Array(BigInt(observation.bridgeFee)),
      bigIntToUint8Array(BigInt(observation.networkFee)),
      Buffer.from(observation.sourceChainTokenId),
      Buffer.from(observation.targetChainTokenId),
      Buffer.from(observation.sourceBlockId),
      bigIntToUint8Array(BigInt(observation.height)),
    ];

    const permitHash = ErgoUtils.contractHash(
      wasm.Contract.pay_to_address(
        wasm.Address.from_base58(getConfig().rosen.watcherPermitAddress)
      )
    );
    const widListHash = Buffer.from(
      blake2b(Buffer.from(WIDs.join(''), 'hex'), undefined, 32)
    );
    builder.set_register_value(4, wasm.Constant.from_byte_array(widListHash));
    builder.set_register_value(5, wasm.Constant.from_coll_coll_byte(eventData));
    builder.set_register_value(6, wasm.Constant.from_byte_array(permitHash));
    builder.set_register_value(7, wasm.Constant.from_i32(WIDs.length));
    return builder.build();
  };

  /**
   * create repo box that used in output of permit transactions
   * @param height
   * @param RWTCount
   * @param RSNCount
   * @param AWCCount
   * @param chainId
   * @param watcherCount
   */
  createRepo = async (
    height: number,
    value: string,
    RWTCount: string,
    RSNCount: string,
    AWCCount: string,
    chainId: Uint8Array,
    watcherCount: number
  ) => {
    const repoBuilder = new wasm.ErgoBoxCandidateBuilder(
      wasm.BoxValue.from_i64(wasm.I64.from_str(value)),
      this.repoAddressContract,
      height
    );
    repoBuilder.add_token(
      this.repoNFTId,
      wasm.TokenAmount.from_i64(wasm.I64.from_str('1'))
    );
    repoBuilder.add_token(
      this.RWTTokenId,
      wasm.TokenAmount.from_i64(wasm.I64.from_str(RWTCount))
    );
    repoBuilder.add_token(
      this.RSN,
      wasm.TokenAmount.from_i64(wasm.I64.from_str(RSNCount))
    );
    repoBuilder.add_token(
      this.AWC,
      wasm.TokenAmount.from_i64(wasm.I64.from_str(AWCCount))
    );

    repoBuilder.set_register_value(4, wasm.Constant.from_byte_array(chainId));
    repoBuilder.set_register_value(
      5,
      wasm.Constant.from_i64(wasm.I64.from_str(watcherCount.toString()))
    );
    const boxVal = repoBuilder.calc_min_box_value();
    logger.debug(`calculated value for repo: [${boxVal.as_i64().to_str()}]`);
    if (boxVal > this.minBoxValue) repoBuilder.set_value(boxVal);
    return repoBuilder.build();
  };

  /**
   * create WID box that used in output of commitment transaction
   * @param height
   * @param WID
   * @param ergAmount
   * @param contract
   */
  createWIDBox = (
    height: number,
    WID: string,
    ergAmount: string,
    widCount: string,
    contract?: wasm.Contract,
    issueNewWID = false
  ): wasm.ErgoBoxCandidate => {
    const WIDBuilder = new wasm.ErgoBoxCandidateBuilder(
      wasm.BoxValue.from_i64(wasm.I64.from_str(ergAmount)),
      contract
        ? contract
        : wasm.Contract.pay_to_address(
            getConfig().general.secretKey.get_address()
          ),
      height
    );
    WIDBuilder.add_token(
      wasm.TokenId.from_str(WID),
      wasm.TokenAmount.from_i64(wasm.I64.from_str(widCount))
    );
    if (issueNewWID) {
      const address = getConfig().general.address;
      WIDBuilder.set_register_value(
        4,
        wasm.Constant.from_byte_array(
          strToUint8Array(
            `WID-${WID.substring(WID.length - 5)}-${address.substring(
              address.length - 7
            )}`
          )
        )
      );
      WIDBuilder.set_register_value(
        5,
        wasm.Constant.from_byte_array(
          strToUint8Array(`Rosen Watcher ID (${address})`)
        )
      );
      WIDBuilder.set_register_value(
        6,
        wasm.Constant.from_byte_array(strToUint8Array('0'))
      );
      WIDBuilder.set_register_value(
        7,
        wasm.Constant.from_byte_array(strToUint8Array('1'))
      );
    }
    return WIDBuilder.build();
  };

  /**
   * Creates an arbitrary box paying to the given contract, with custom amount
   * @param contract
   * @param amount
   * @param height create height of the box
   */
  createCustomBox = (
    contract: wasm.Contract,
    amount: AddressBalance,
    height: number
  ): wasm.ErgoBoxCandidate => {
    const boxBuilder = new wasm.ErgoBoxCandidateBuilder(
      wasm.BoxValue.from_i64(wasm.I64.from_str(amount.nanoErgs.toString())),
      contract,
      height
    );

    for (const token of amount.tokens) {
      boxBuilder.add_token(
        wasm.TokenId.from_str(token.tokenId),
        wasm.TokenAmount.from_i64(wasm.I64.from_str(token.amount.toString()))
      );
    }

    return boxBuilder.build();
  };

  /**
   * Return a new collateral box with required parameters
   * @param value
   * @param height
   * @param wid
   * @param rwtCount
   * @param rsnCount
   * @returns
   */
  createCollateralBox = (
    value: bigint,
    height: number,
    wid: string,
    rwtCount: bigint,
    rsnCount: bigint
  ) => {
    const boxBuilder = new wasm.ErgoBoxCandidateBuilder(
      wasm.BoxValue.from_i64(wasm.I64.from_str(value.toString())),
      this.watcherCollateralContract,
      height
    );
    boxBuilder.add_token(
      this.AWC,
      wasm.TokenAmount.from_i64(wasm.I64.from_str('1'))
    );
    if (rsnCount)
      boxBuilder.add_token(
        this.RSN,
        wasm.TokenAmount.from_i64(wasm.I64.from_str(rsnCount.toString()))
      );
    boxBuilder.set_register_value(
      4,
      wasm.Constant.from_byte_array(Buffer.from(wid, 'hex'))
    );
    const tokenMap = getConfig().token.tokenMap;
    const wrappedRwtCount = tokenMap.wrapAmount(
      getConfig().rosen.RWTId,
      rwtCount,
      ERGO_CHAIN_NAME
    ).amount;
    boxBuilder.set_register_value(
      5,
      wasm.Constant.from_i64(wasm.I64.from_str(wrappedRwtCount.toString()))
    );
    return boxBuilder.build();
  };

  /**
   * Return a new rsn emission box with required parameters
   * @param value
   * @param height
   * @param rsnCount
   * @param eRsnCount
   */
  createEmissionBox = (
    value: bigint,
    height: number,
    rsnCount: bigint,
    eRsnCount: bigint
  ) => {
    const boxBuilder = new wasm.ErgoBoxCandidateBuilder(
      wasm.BoxValue.from_i64(wasm.I64.from_str(value.toString())),
      this.emissionContract,
      height
    );
    boxBuilder.add_token(
      this.emissionNft,
      wasm.TokenAmount.from_i64(wasm.I64.from_str('1'))
    );
    boxBuilder.add_token(
      this.RSN,
      wasm.TokenAmount.from_i64(wasm.I64.from_str(rsnCount.toString()))
    );
    boxBuilder.add_token(
      wasm.TokenId.from_str(getConfig().rosen.eRSN),
      wasm.TokenAmount.from_i64(wasm.I64.from_str(eRsnCount.toString()))
    );
    return boxBuilder.build();
  };
}
