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
}
