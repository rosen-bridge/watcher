import { AbstractLogger, DummyLogger } from '@rosen-bridge/abstract-logger';
import { ObservationEntity } from '@rosen-bridge/observation-extractor';
import { RWTRepo } from '@rosen-bridge/rwt-repo';
import { blake2b } from 'blakejs';
import * as ergoLib from 'ergo-lib-wasm-nodejs';
import {
  bigIntToUint8Array,
  hexToUint8Array,
  toScriptHash,
  uint8ArrayToHex,
} from './utils';

export class TriggerTxBuilder {
  private permitScriptHash: string;
  private creationHeight: number;
  private boxIterator: Iterator<ergoLib.ErgoBox, undefined>;
  private commitments: Array<ergoLib.ErgoBox> = [];
  private wids: Array<string> = [];

  constructor(
    private triggerAddress: string,
    private commitmentAddress: string,
    private permitAddress: string,
    private changeAddress: string,
    private rwt: string,
    private txFee: string,
    private rwtRepo: RWTRepo,
    private observation: ObservationEntity,
    private logger: AbstractLogger = new DummyLogger()
  ) {
    this.permitScriptHash = toScriptHash(permitAddress);
  }

  /**
   * sets creation height for the current instance
   *
   * @param {number} height
   * @return {TriggerTxBuilder}
   */
  setCreationHeight = (height: number): TriggerTxBuilder => {
    if (height < 1) {
      throw new Error('creation height must be a positive integer');
    }
    this.creationHeight = height;
    this.logger.debug(`new value set for height=[${this.creationHeight}]`);
    return this;
  };

  /**
   * sets boxIterator for the current instance
   *
   * @param {Iterator<ergoLib.ErgoBox, undefined>} boxIterator
   * @return {TriggerTxBuilder}
   */
  setBoxIterator = (
    boxIterator: Iterator<ergoLib.ErgoBox, undefined>
  ): TriggerTxBuilder => {
    this.boxIterator = boxIterator;
    return this;
  };

  /**
   * adds new commitments to current instance's set of commitments.
   *
   * @param {Array<ergoLib.ErgoBox>} commitments
   * @return {TriggerTxBuilder}
   */
  addCommitments = (commitments: Array<ergoLib.ErgoBox>): TriggerTxBuilder => {
    const currentWids = new Set(this.wids);
    const validCommitments: Array<ergoLib.ErgoBox> = [];
    const validWids: Array<string> = [];
    for (const commitment of commitments) {
      const wid = this.validateCommitment(commitment);
      if (currentWids.has(wid)) {
        throw new Error(
          `the commitment with boxId=[${commitment
            .box_id()
            .to_str()}] has a repetitive wid=[${wid}]`
        );
      }
      currentWids.add(wid);
      validCommitments.push(commitment);
      validWids.push(wid);
    }
    this.commitments.push(...validCommitments);
    this.wids.push(...validWids);
    this.logger.debug(
      `added new commitments with boxIds=[${validCommitments
        .map((commitment) => commitment.box_id().to_str())
        .join(', ')}] and wids=[${this.wids.join(
        ', '
      )}]: this.commitments=[${this.commitments.map((commitment) =>
        commitment.box_id().to_str()
      )}]`
    );

    return this;
  };

  /**
   * validates the passed commitment box
   *
   * @param {ergoLib.ErgoBox} commitment
   * @return {string} the wid of passed commitment
   */
  private validateCommitment = (commitment: ergoLib.ErgoBox): string => {
    if (
      this.commitments.some(
        (box) => box.box_id().to_str() === commitment.box_id().to_str()
      )
    ) {
      throw new Error(
        `box with boxId=[${commitment
          .box_id()
          .to_str()}] is already included in commitments`
      );
    }

    if (
      ergoLib.Address.from_base58(this.commitmentAddress)
        .to_ergo_tree()
        .to_base16_bytes() !== commitment.ergo_tree().to_base16_bytes()
    ) {
      throw new Error(
        `commitment with boxId=[${commitment
          .box_id()
          .to_str()}] doesn't have the right commitment address`
      );
    }

    if (commitment.tokens().get(0).id().to_str() !== this.rwt) {
      throw new Error(
        `commitment with boxId=[${commitment
          .box_id()
          .to_str()}] should have rwt as the first token`
      );
    }

    if (
      commitment.tokens().get(0).amount().as_i64().to_str() !==
      this.rwtRepo.getCommitmentRwtCount().toString()
    ) {
      throw new Error(
        `commitment with boxId=[${commitment
          .box_id()
          .to_str()}] should have [${this.rwtRepo.getCommitmentRwtCount()}] rwt tokens buts has [${commitment
          .tokens()
          .get(0)
          .amount()
          .as_i64()
          .to_str()}]`
      );
    }

    const widBytes = commitment.register_value(4)?.to_coll_coll_byte()[0];
    if (widBytes == undefined) {
      throw new Error(
        'commitment should have a wid defined in its R4 register'
      );
    }
    const wid = uint8ArrayToHex(widBytes);
    const eventDigest = uint8ArrayToHex(this.calcEventDigest(wid));
    const boxEventDigestBytes = commitment.register_value(6)?.to_byte_array();
    if (boxEventDigestBytes == undefined) {
      throw new Error(
        'commitment should have an event digest defined in its R6 register'
      );
    }
    const boxEventDigest = uint8ArrayToHex(boxEventDigestBytes);
    if (boxEventDigest !== eventDigest) {
      throw new Error(
        `commitment doesn't have the correct event digest for wid=[${wid}] and observationId=[${this.observation.id}]`
      );
    }

    return wid;
  };

  /**
   * calculates event digest for this instance's observation and passed wid
   *
   * @private
   * @param {string} wid
   * @return {Uint8Array}
   */
  private calcEventDigest = (wid: string): Uint8Array => {
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
      Buffer.from(wid, 'hex'),
    ]);
    return blake2b(content, undefined, 32);
  };

  /**
   * creates the trigger box
   *
   * @param {bigint} rwtCount
   * @param {bigint} value
   * @return {ergoLib.ErgoBoxCandidate}
   */
  private createTriggerBox = (
    rwtCount: bigint,
    value: bigint
  ): ergoLib.ErgoBoxCandidate => {
    const boxBuilder = new ergoLib.ErgoBoxCandidateBuilder(
      ergoLib.BoxValue.from_i64(ergoLib.I64.from_str(value.toString())),
      ergoLib.Contract.pay_to_address(
        ergoLib.Address.from_base58(this.triggerAddress)
      ),
      this.creationHeight
    );

    boxBuilder.add_token(
      ergoLib.TokenId.from_str(this.rwt),
      ergoLib.TokenAmount.from_i64(ergoLib.I64.from_str(rwtCount.toString()))
    );
    this.logger.debug(
      `added rwt tokens to trigger box with amount=[${rwtCount}]`
    );

    boxBuilder.set_register_value(
      4,
      ergoLib.Constant.from_coll_coll_byte(
        this.wids.map((wid) => hexToUint8Array(wid))
      )
    );
    this.logger.debug(
      `added wids to R4 register of trigger box: wids=[${this.wids}]`
    );

    boxBuilder.set_register_value(
      5,
      ergoLib.Constant.from_coll_coll_byte(this.eventData)
    );
    this.logger.debug(
      `added event data to R5 register of trigger box: event-data=[${this.eventData.map(
        (data) => uint8ArrayToHex(data)
      )}]`
    );

    boxBuilder.set_register_value(
      6,
      ergoLib.Constant.from_byte_array(hexToUint8Array(this.permitScriptHash))
    );
    this.logger.debug(
      `added permit script hash to R6 register of trigger box: permit-script-hash=[${this.permitScriptHash}]`
    );

    return boxBuilder.build();
  };

  private get eventData() {
    return [
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
    ];
  }
}
