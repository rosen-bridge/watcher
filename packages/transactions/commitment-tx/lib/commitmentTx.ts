import { AbstractLogger } from '@rosen-bridge/abstract-logger';
import { ObservationEntity } from '@rosen-bridge/observation-extractor';
import { RWTRepo } from '@rosen-bridge/rwt-repo';
import { blake2b } from 'blakejs';
import * as ergoLib from 'ergo-lib-wasm-nodejs';
import { bigIntToUint8Array } from './utils';

export class CommitmentTx {
  private static _instance?: CommitmentTx;

  private permitScriptHash: string;

  private constructor(
    private permitAddress: string,
    private permitBoxValue: bigint,
    private commitmentAddress: string,
    private commitmentBoxValue: bigint,
    private rwt: string,
    private txFee: string,
    private rwtRepo: RWTRepo,
    private logger?: AbstractLogger
  ) {}

  /**
   * creates the singleton instance of CommitmentTx and stores it in _instance
   * property
   *
   * @static
   * @param {string} permitAddress
   * @param {string} commitmentAddress
   * @param {string} rwt
   * @param {string} txFee
   * @param {RWTRepo} rwtRepo
   * @param {AbstractLogger} [logger]
   * @return {void}
   * @memberof CommitmentTx
   */
  static init = (
    permitAddress: string,
    permitBoxValue: bigint,
    commitmentAddress: string,
    commitmentBoxValue: bigint,
    rwt: string,
    txFee: string,
    rwtRepo: RWTRepo,
    logger?: AbstractLogger
  ): void => {
    if (CommitmentTx._instance != undefined) {
      return;
    }

    CommitmentTx._instance = new CommitmentTx(
      permitAddress,
      permitBoxValue,
      commitmentAddress,
      commitmentBoxValue,
      rwt,
      txFee,
      rwtRepo,
      logger
    );

    CommitmentTx._instance.permitScriptHash = toScriptHash(permitAddress);
  };

  /**
   * return the singleton instance of CommitmentTx
   *
   * @static
   * @return {CommitmentTx}
   * @memberof CommitmentTx
   */
  static getInstance = (): CommitmentTx => {
    if (!this._instance) {
      throw new Error('CommitmentTx instance is not initialized yet');
    }
    return this._instance;
  };

  /**
   * creates a new instance of CommitmentTxBuilder
   *
   * @param {ObservationEntity} observation
   * @return {CommitmentTxBuilder}
   * @memberof CommitmentTx
   */
  newBuilder = (observation: ObservationEntity): CommitmentTxBuilder => {
    return new CommitmentTxBuilder(
      this.permitAddress,
      this.permitBoxValue,
      this.permitScriptHash,
      this.commitmentAddress,
      this.commitmentBoxValue,
      this.rwt,
      this.txFee,
      this.rwtRepo,
      observation,
      this.logger
    );
  };
}

export class CommitmentTxBuilder {
  private eventId: string;
  private wid: string;
  private permits: Array<ergoLib.ErgoBox> = [];
  private widBox: ergoLib.ErgoBox;
  private height: number;
  private changeAddress: string;
  private boxIterator: Iterator<ergoLib.ErgoBox, undefined>;

  constructor(
    private permitAddress: string,
    private permitBoxValue: bigint,
    private permitScriptHash: string,
    private commitmentAddress: string,
    private commitmentBoxValue: bigint,
    private rwt: string,
    private txFee: string,
    private rwtRepo: RWTRepo,
    private observation: ObservationEntity,
    private logger?: AbstractLogger
  ) {
    this.eventId = observation.requestId;
  }

  /**
   * sets wid for the current instance
   *
   * @param {string} wid
   * @return {CommitmentTxBuilder}
   * @memberof CommitmentTxBuilder
   */
  setWid = (wid: string): CommitmentTxBuilder => {
    this.wid = wid;
    this.logger?.debug(`new value set for wid=[${this.wid}]`);
    return this;
  };

  /**
   * adds new permits to current instance's set of permits. throws exception if
   * try to add repetitive permits.
   *
   * @param {Array<ergoLib.ErgoBox>} permits
   * @return {CommitmentTxBuilder}
   * @memberof CommitmentTxBuilder
   */
  addPermits = (permits: Array<ergoLib.ErgoBox>): CommitmentTxBuilder => {
    const currentBoxIds = new Set(
      this.permits.map((permit) => permit.box_id().to_str())
    );

    for (const box of permits) {
      if (currentBoxIds.has(box.box_id().to_str())) {
        throw new Error(
          `box with boxId=[${box
            .box_id()
            .to_str()}] already included in permits`
        );
      }
      currentBoxIds.add(box.box_id().to_str());
    }

    this.permits = this.permits.concat(permits);
    this.logger?.debug(
      `added new permits=[${permits.map((permit) =>
        permit.box_id().to_str()
      )}]: this.permits=[${this.permits.map((permit) =>
        permit.box_id().to_str()
      )}}`
    );
    return this;
  };

  /**
   * sets widBox for the current instance
   *
   * @param {ergoLib.ErgoBox} widBox
   * @return {CommitmentTxBuilder}
   * @memberof CommitmentTxBuilder
   */
  setWidBox = (widBox: ergoLib.ErgoBox): CommitmentTxBuilder => {
    this.widBox = widBox;
    this.logger?.debug(
      `new value set for widBox=[${this.widBox.box_id().to_str()}]`
    );
    return this;
  };

  /**
   * sets boxIterator for the current instance
   */

  setBoxIterator = (
    boxIterator: Iterator<ergoLib.ErgoBox, undefined>
  ): CommitmentTxBuilder => {
    this.boxIterator = boxIterator;
    return this;
  };

  /**
   * sets creation height for the current instance
   *
   * @param {number} height
   * @return {CommitmentTxBuilder}
   * @memberof CommitmentTxBuilder
   */
  setCreationHeight = (height: number): CommitmentTxBuilder => {
    if (height < 1) {
      throw new Error('creation height must be a positive integer');
    }
    this.height = height;
    this.logger?.debug(`new value set for height=[${this.height}]`);
    return this;
  };

  /**
   * creates permit box
   *
   * @private
   * @param {bigint} rwtCount
   * @return {ergoLib.ErgoBoxCandidate}
   * @memberof CommitmentTxBuilder
   */
  private createPermitBox = (rwtCount: bigint): ergoLib.ErgoBoxCandidate => {
    const boxBuilder = new ergoLib.ErgoBoxCandidateBuilder(
      ergoLib.BoxValue.from_i64(
        ergoLib.I64.from_str(this.permitBoxValue.toString())
      ),
      ergoLib.Contract.pay_to_address(
        ergoLib.Address.from_base58(this.permitAddress)
      ),
      this.height
    );

    boxBuilder.add_token(
      ergoLib.TokenId.from_str(this.rwt),
      ergoLib.TokenAmount.from_i64(ergoLib.I64.from_str(rwtCount.toString()))
    );

    boxBuilder.set_register_value(
      4,
      ergoLib.Constant.from_coll_coll_byte([
        Uint8Array.from(Buffer.from(this.wid, 'hex')),
      ])
    );
    boxBuilder.set_register_value(
      5,
      ergoLib.Constant.from_coll_coll_byte([Buffer.from('00', 'hex')])
    );

    return boxBuilder.build();
  };

  /**
   * creates commitment box
   *
   * @private
   * @return {ergoLib.ErgoBoxCandidate}
   * @memberof CommitmentTxBuilder
   */
  private createCommitmentBox = (): ergoLib.ErgoBoxCandidate => {
    const boxBuilder = new ergoLib.ErgoBoxCandidateBuilder(
      ergoLib.BoxValue.from_i64(
        ergoLib.I64.from_str(this.commitmentBoxValue.toString())
      ),
      ergoLib.Contract.pay_to_address(
        ergoLib.Address.from_base58(this.commitmentAddress)
      ),
      this.height
    );

    boxBuilder.add_token(
      ergoLib.TokenId.from_str(this.rwt),
      ergoLib.TokenAmount.from_i64(
        ergoLib.I64.from_str(this.rwtRepo.getCommitmentRwtCount().toString())
      )
    );

    boxBuilder.set_register_value(
      4,
      ergoLib.Constant.from_coll_coll_byte([
        Uint8Array.from(Buffer.from(this.wid, 'hex')),
      ])
    );

    boxBuilder.set_register_value(
      5,
      ergoLib.Constant.from_coll_coll_byte([
        Uint8Array.from(Buffer.from(this.eventId, 'hex')),
      ])
    );

    boxBuilder.set_register_value(
      6,
      ergoLib.Constant.from_byte_array(this.eventDigest)
    );

    boxBuilder.set_register_value(
      7,
      ergoLib.Constant.from_byte_array(
        Uint8Array.from(Buffer.from(this.permitScriptHash, 'hex'))
      )
    );

    return boxBuilder.build();
  };

  /**
   * calculates event digest for this instance's observation and wid
   *
   * @readonly
   * @private
   * @memberof CommitmentTxBuilder
   */
  private get eventDigest() {
    const content = Buffer.concat([
      Buffer.from(this.observation.sourceTxId),
      Buffer.from(this.observation.fromChain),
      Buffer.from(this.observation.toChain),
      Buffer.from(this.observation.fromAddress),
      Buffer.from(this.observation.toAddress),
      bigIntToUint8Array(BigInt(this.observation.amount)),
      bigIntToUint8Array(BigInt(this.observation.bridgeFee)),
      bigIntToUint8Array(BigInt(this.observation.networkFee)),
      Buffer.from(this.observation.sourceChainTokenId),
      Buffer.from(this.observation.targetChainTokenId),
      Buffer.from(this.observation.sourceBlockId),
      bigIntToUint8Array(BigInt(this.observation.height)),
      Buffer.from(this.wid, 'hex'),
    ]);
    return blake2b(content, undefined, 32);
  }

  /**
   * build an unsigned transaction which spends wid and permit boxes to generate
   * a commitment, wid and residual permit boxes
   *
   * @param {number} creationHeight
   * @return {Promise<{
   *     unsignedTx: ergoLib.UnsignedTransaction;
   *     inputBoxes: ergoLib.ErgoBox[];
   *   }>}
   * @memberof CommitmentTxBuilder
   */
  build = async (): Promise<{
    unsignedTx: ergoLib.UnsignedTransaction;
    inputBoxes: ergoLib.ErgoBox[];
  }> => {
    const residualRwtCount =
      this.permits
        .map((permit) =>
          BigInt(permit.tokens().get(0).amount().as_i64().to_str())
        )
        .reduce((sum, val) => sum + val, 0n) -
      this.rwtRepo.getCommitmentRwtCount();

    const outputBoxes: ergoLib.ErgoBoxCandidate[] = [
      this.createPermitBox(residualRwtCount),
      this.createCommitmentBox(),
    ];

    const inputBoxes: ergoLib.ErgoBox[] = [this.widBox, ...this.permits];

    const safeMinBoxValue = BigInt(
      ergoLib.BoxValue.SAFE_USER_MIN().as_i64().to_str()
    );
    let requiredValue = BigInt(this.txFee) + safeMinBoxValue;
    requiredValue += outputBoxes
      .map((box) => BigInt(box.value().as_i64().to_str()))
      .reduce((sum, val) => sum + val, 0n);
    requiredValue -= inputBoxes
      .map((box) => BigInt(box.value().as_i64().to_str()))
      .reduce((sum, val) => sum + val, 0n);

    let totalInputValue = 0n;
    while (totalInputValue - requiredValue < safeMinBoxValue) {
      const box = await this.boxIterator.next().value;
      if (!box) {
        throw new Error(
          `boxes in box iterator are not enough to cover value=[${requiredValue}]`
        );
      }
      inputBoxes.push(box);
      totalInputValue += BigInt(box.value().as_i64().to_str());
    }

    const extraTokensBox = this.getExtraTokensBox(
      inputBoxes,
      outputBoxes,
      totalInputValue - requiredValue
    );
    if (extraTokensBox.tokens().len() > 0) {
      outputBoxes.push(this.getOutputWidBox());
      outputBoxes.push(extraTokensBox);
    } else {
      requiredValue -= safeMinBoxValue;
      outputBoxes.push(this.getOutputWidBox(totalInputValue - requiredValue));
    }

    const inputErgoBoxes = ergoLib.ErgoBoxes.empty();
    inputBoxes.forEach((box) => inputErgoBoxes.add(box));
    const ergoBoxCandidates = ergoLib.ErgoBoxCandidates.empty();
    outputBoxes.forEach((box) => ergoBoxCandidates.add(box));
    const txBuilder = ergoLib.TxBuilder.new(
      new ergoLib.BoxSelection(
        inputErgoBoxes,
        new ergoLib.ErgoBoxAssetsDataList()
      ),
      ergoBoxCandidates,
      this.height,
      ergoLib.BoxValue.from_i64(ergoLib.I64.from_str(this.txFee)),
      ergoLib.Address.from_base58(this.changeAddress)
    );

    const unsignedTx = txBuilder.build();

    return { unsignedTx, inputBoxes };
  };

  /**
   * creates an output wid box to be used in commitment transaction
   *
   * @private
   * @param {number} creationHeight
   * @return {ergoLib.ErgoBoxCandidate}
   * @memberof CommitmentTxBuilder
   */
  private getOutputWidBox = (
    changeValue?: bigint
  ): ergoLib.ErgoBoxCandidate => {
    const boxBuilder = new ergoLib.ErgoBoxCandidateBuilder(
      changeValue
        ? ergoLib.BoxValue.from_i64(
            ergoLib.I64.from_str(changeValue.toString())
          )
        : ergoLib.BoxValue.SAFE_USER_MIN(),
      ergoLib.Contract.new(this.widBox.ergo_tree()),
      this.height
    );
    boxBuilder.add_token(
      ergoLib.TokenId.from_str(this.wid),
      ergoLib.TokenAmount.from_i64(ergoLib.I64.from_str('1'))
    );

    return boxBuilder.build();
  };

  /**
   * creates an output box with remaining tokens to be used in commitment
   * transaction and the change value
   *
   * @private
   * @param {ergoLib.ErgoBoxCandidate[]} inputBoxes
   * @param {number} creationHeight
   * @return {ergoLib.ErgoBoxCandidate}
   * @memberof CommitmentTxBuilder
   */
  private getExtraTokensBox = (
    inputBoxes: ergoLib.ErgoBox[],
    outputBoxes: ergoLib.ErgoBoxCandidate[],
    changeValue: bigint
  ): ergoLib.ErgoBoxCandidate => {
    const tokens = new Map<string, bigint>();
    for (const box of inputBoxes) {
      for (let i = 0; i < box.tokens().len(); i++) {
        const token = box.tokens().get(i);
        const tokenId = token.id().to_str();
        if (tokenId === this.wid) {
          continue;
        }
        const tokenAmount = BigInt(token.amount().as_i64().to_str());
        tokens.set(tokenId, tokenAmount + (tokens.get(tokenId) || 0n));
      }
    }

    for (const box of outputBoxes) {
      for (let i = 0; i < box.tokens().len(); i++) {
        const token = box.tokens().get(i);
        const tokenId = token.id().to_str();
        const tokenAmount = BigInt(token.amount().as_i64().to_str());
        tokens.set(tokenId, (tokens.get(tokenId) || 0n) - tokenAmount);
      }
    }

    const boxBuilder = new ergoLib.ErgoBoxCandidateBuilder(
      ergoLib.BoxValue.from_i64(ergoLib.I64.from_str(changeValue.toString())),
      ergoLib.Contract.pay_to_address(
        ergoLib.Address.from_base58(this.changeAddress)
      ),
      this.height
    );

    tokens.forEach((amount, id) => {
      if (amount > 0) {
        boxBuilder.add_token(
          ergoLib.TokenId.from_str(id),
          ergoLib.TokenAmount.from_i64(ergoLib.I64.from_str(amount.toString()))
        );
      }
    });

    return boxBuilder.build();
  };

  /**
   * sets change address to be used in commitment transaction
   *
   * @param {string} address
   * @memberof CommitmentTxBuilder
   */
  setChangeAddress(address: string) {
    this.changeAddress = address;
  }
}

/**
 * calculates scriptHash for passed Address
 *
 * @param {string} address
 * @return {*}  {string}
 */
export const toScriptHash = (address: string): string => {
  const permitScriptHash = Buffer.from(
    blake2b(
      Buffer.from(
        ergoLib.Address.from_base58(address).to_ergo_tree().to_base16_bytes(),
        'hex'
      ),
      undefined,
      32
    )
  ).toString('hex');
  return permitScriptHash;
};
