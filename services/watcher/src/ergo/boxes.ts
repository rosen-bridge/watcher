import * as wasm from 'ergo-lib-wasm-nodejs';
import {
  bigintMax,
  boxHaveAsset,
  decodeSerializedBox,
  ErgoUtils,
} from './utils';
import { bigIntToUint8Array, hexStrToUint8Array } from '../utils/utils';
import { WatcherDataBase } from '../database/models/watcherModel';
import { Observation } from '../utils/interfaces';
import { ErgoNetwork } from './network/ergoNetwork';
import { Buffer } from 'buffer';
import { BoxEntity } from '@rosen-bridge/address-extractor';
import { NotEnoughFund, NoWID } from '../errors/errors';
import { getConfig } from '../config/config';
import { AddressBalance } from './interfaces';
import { JsonBI } from './network/parser';

export class Boxes {
  dataBase: WatcherDataBase;
  repoNFTId: wasm.TokenId;
  RWTTokenId: wasm.TokenId;
  RSN: wasm.TokenId;
  watcherPermitContract: wasm.Contract;
  minBoxValue: wasm.BoxValue;
  fee: wasm.BoxValue;
  userAddressContract: wasm.Contract;
  repoAddressContract: wasm.Contract;
  watcherCollateralContract: wasm.Contract;
  repoAddress: wasm.Address;

  constructor(db: WatcherDataBase) {
    const rosenConfig = getConfig().rosen;
    this.dataBase = db;
    this.repoNFTId = wasm.TokenId.from_str(rosenConfig.RepoNFT);
    this.RWTTokenId = wasm.TokenId.from_str(rosenConfig.RWTId);
    this.RSN = wasm.TokenId.from_str(rosenConfig.RSN);
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
    this.fee = wasm.BoxValue.from_i64(
      wasm.I64.from_str(getConfig().general.fee)
    );
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
   * Returns unspent WID boxes with the specified WID (Considering the mempool)
   * @param wid
   */
  getWIDBox = async (wid?: string): Promise<wasm.ErgoBox> => {
    if (wid) {
      const WID = (await this.dataBase.getUnspentAddressBoxes())
        .map((box: BoxEntity) => {
          return decodeSerializedBox(box.serialized);
        })
        .filter(
          (box: wasm.ErgoBox) =>
            box.tokens().len() > 0 && boxHaveAsset(box, wid)
        )[0];
      if (!WID)
        throw new NoWID(
          'WID box is not found. Cannot sign the transaction. Please check that the box containing the WID is created after the scanner initial height.'
        );
      return await this.dataBase.trackTxQueue(
        await ErgoNetwork.trackMemPool(WID, wid),
        wid
      );
    } else
      throw new NoWID('Watcher WID is not set. Cannot sign the transaction.');
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
      if (boxIdsToOmit.includes(box.box_id().to_str())) continue;
      let unspentBox = await ErgoNetwork.trackMemPool(box);
      if (unspentBox) unspentBox = await this.dataBase.trackTxQueue(unspentBox);
      const isBoxNotSelected = selectedBoxes.every(
        (box) => box.box_id().to_str() !== unspentBox.box_id().to_str()
      );
      if (unspentBox && isBoxNotSelected) {
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
    builder.set_register_value(4, wasm.Constant.from_coll_coll_byte([WID]));
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
      wasm.Constant.from_coll_coll_byte([hexStrToUint8Array(WID)])
    );
    builder.set_register_value(
      5,
      wasm.Constant.from_coll_coll_byte([hexStrToUint8Array(requestId)])
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
    WIDs: Array<Uint8Array>,
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
    builder.set_register_value(4, wasm.Constant.from_coll_coll_byte(WIDs));
    builder.set_register_value(5, wasm.Constant.from_coll_coll_byte(eventData));
    builder.set_register_value(6, wasm.Constant.from_byte_array(permitHash));
    return builder.build();
  };

  /**
   * create repo box that used in output of permit transactions
   * @param height
   * @param RWTCount
   * @param RSNCount
   * @param users
   * @param userRWT
   * @param R6
   * @param R7
   */
  createRepo = async (
    height: number,
    RWTCount: string,
    RSNCount: string,
    users: Array<Uint8Array>,
    userRWT: Array<string>,
    R6: wasm.Constant,
    R7?: number
  ) => {
    const repoBuilder = new wasm.ErgoBoxCandidateBuilder(
      this.minBoxValue,
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

    repoBuilder.set_register_value(4, wasm.Constant.from_coll_coll_byte(users));
    repoBuilder.set_register_value(
      5,
      wasm.Constant.from_i64_str_array(userRWT)
    );
    repoBuilder.set_register_value(6, R6);
    R7 && repoBuilder.set_register_value(7, wasm.Constant.from_i32(R7));
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
    contract?: wasm.Contract
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
      wasm.TokenAmount.from_i64(wasm.I64.from_str('1'))
    );
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

  createCollateralBox = (
    amount: AddressBalance,
    height: number,
    wid: string
  ) => {
    const boxBuilder = new wasm.ErgoBoxCandidateBuilder(
      wasm.BoxValue.from_i64(wasm.I64.from_str(amount.nanoErgs.toString())),
      this.watcherCollateralContract,
      height
    );
    for (const token of amount.tokens) {
      if (token.amount > 0n) {
        boxBuilder.add_token(
          wasm.TokenId.from_str(token.tokenId),
          wasm.TokenAmount.from_i64(wasm.I64.from_str(token.amount.toString()))
        );
      }
    }
    boxBuilder.set_register_value(
      4,
      wasm.Constant.from_byte_array(Buffer.from(wid, 'hex'))
    );
    return boxBuilder.build();
  };
}