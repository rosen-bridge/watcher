import { AbstractLogger } from '@rosen-bridge/abstract-logger';
import { RWTRepo } from '@rosen-bridge/rwt-repo';

export class TriggerTx {
  private static _instance?: TriggerTx;

  private constructor(
    private triggerAddress: string,
    private commitmentAddress: string,
    private permitAddress: string,
    private changeAddress: string,
    private rwt: string,
    private txFee: string,
    private rwtRepo: RWTRepo,
    private logger?: AbstractLogger
  ) {}

  /**
   * initializes the singleton instance of TriggerTx
   *
   * @static
   * @param {string} triggerAddress
   * @param {string} commitmentAddress
   * @param {string} permitAddress
   * @param {string} changeAddress
   * @param {string} rwt
   * @param {string} txFee
   * @param {RWTRepo} rwtRepo
   * @param {AbstractLogger} [logger]
   * @return {void}
   */
  static init(
    triggerAddress: string,
    commitmentAddress: string,
    permitAddress: string,
    changeAddress: string,
    rwt: string,
    txFee: string,
    rwtRepo: RWTRepo,
    logger?: AbstractLogger
  ): void {
    if (TriggerTx._instance != undefined) {
      return;
    }

    TriggerTx._instance = new TriggerTx(
      triggerAddress,
      commitmentAddress,
      permitAddress,
      changeAddress,
      rwt,
      txFee,
      rwtRepo,
      logger
    );
  }
}
