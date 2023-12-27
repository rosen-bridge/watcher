import { AbstractLogger } from '@rosen-bridge/abstract-logger';
import { RWTRepo } from '@rosen-bridge/rwt-repo';
import * as ergoLib from 'ergo-lib-wasm-nodejs';

export class GetPermitBuilder {
  private wid: string;
  private widBox: ergoLib.ErgoBox;
  private boxIterator: Iterator<ergoLib.ErgoBox, undefined>;
  private height: number;
  private rwtCount: bigint;

  constructor(
    private permitAddress: string,
    private collateralAddress: string,
    private changeAddress: string,
    private rsn: string,
    private rwt: string,
    private txFee: bigint,
    private rwtRepo: RWTRepo,
    private logger?: AbstractLogger
  ) {}

  /**
   * sets this instance's wid
   *
   * @param {string} wid
   * @return {GetPermitBuilder}
   */
  setWid = (wid: string): GetPermitBuilder => {
    this.wid = wid;
    return this;
  };

  /**
   * sets this instance's widBox
   *
   * @param {ergoLib.ErgoBox} widBox
   * @return {GetPermitBuilder}
   */
  setWidBox = (widBox: ergoLib.ErgoBox): GetPermitBuilder => {
    if (this.wid == undefined) {
      throw new Error('wid must best on the instance before calling setWidBox');
    }

    const tokens = widBox.tokens();
    if (tokens.len() < 1 || tokens.get(0).id().to_str() !== this.wid) {
      throw new Error(`the first token of widBox should have id=${this.wid}`);
    }

    this.widBox = widBox;
    return this;
  };

  /**
   * sets this instance's boxIterator
   *
   * @param {Iterator<ergoLib.ErgoBox, undefined>} boxIterator
   * @return {GetPermitBuilder}
   */
  setBoxIterator = (
    boxIterator: Iterator<ergoLib.ErgoBox, undefined>
  ): GetPermitBuilder => {
    this.boxIterator = boxIterator;
    return this;
  };

  /**
   * sets this instance's creation height
   *
   * @param {number} height
   * @return {GetPermitBuilder}
   */
  setCreationHeight = (height: number): GetPermitBuilder => {
    this.height = height;
    return this;
  };

  /**
   * sets this instance's RWT count
   *
   * @param {bigint} rwtCount
   * @return {GetPermitBuilder}
   */
  setRWTCount = (rwtCount: bigint): GetPermitBuilder => {
    this.rwtCount = rwtCount;
    return this;
  };
}
