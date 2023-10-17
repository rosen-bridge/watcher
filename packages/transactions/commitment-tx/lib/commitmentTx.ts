import { AbstractLogger } from '@rosen-bridge/abstract-logger';
import { ObservationEntity } from '@rosen-bridge/observation-extractor';
import { RWTRepo } from '@rosen-bridge/rwt-repo';
import { blake2b } from 'blakejs';
import * as ergoLib from 'ergo-lib-wasm-nodejs';

export class CommitmentTx {
  private static _instance?: CommitmentTx;

  private permitScriptHash: string;

  private constructor(
    private permitAddress: string,
    private commitmentAddress: string,
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
    commitmentAddress: string,
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
      commitmentAddress,
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
      this.permitScriptHash,
      this.commitmentAddress,
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
    private permitScriptHash: string,
    private commitmentAddress: string,
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
}
