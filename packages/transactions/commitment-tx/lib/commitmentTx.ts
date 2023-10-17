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

    CommitmentTx._instance.permitScriptHash = Buffer.from(
      blake2b(
        Buffer.from(
          ergoLib.Address.from_base58(permitAddress)
            .to_ergo_tree()
            .to_base16_bytes(),
          'hex'
        ),
        undefined,
        32
      )
    ).toString('hex');
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
  private boxIterator: {
    next: () => Promise<ergoLib.ErgoBox | undefined>;
  };

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
      `added new permits=[${permits}]: this.permits=[${this.permits}`
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
    this.logger?.debug(`new value set for widBox=[${this.widBox}]`);
    return this;
  };

  /**
   * sets boxIterator for the current instance
   *
   * @param {({
   *     next: () => Promise<ergoLib.ErgoBox | undefined>;
   *   })} boxIterator
   * @return {CommitmentTxBuilder}
   * @memberof CommitmentTxBuilder
   */
  setBoxIterator = (boxIterator: {
    next: () => Promise<ergoLib.ErgoBox | undefined>;
  }): CommitmentTxBuilder => {
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
}
