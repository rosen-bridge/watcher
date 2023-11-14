import { AbstractLogger } from '@rosen-bridge/abstract-logger';
import { ObservationEntity } from '@rosen-bridge/observation-extractor';
import { RWTRepo } from '@rosen-bridge/rwt-repo';
import { toScriptHash } from './utils';

export class TriggerTxBuilder {
  private permitScriptHash: string;

  constructor(
    private triggerAddress: string,
    private commitmentAddress: string,
    private permitAddress: string,
    private changeAddress: string,
    private rwt: string,
    private txFee: string,
    private rwtRepo: RWTRepo,
    private observation: ObservationEntity,
    private logger?: AbstractLogger
  ) {
    this.permitScriptHash = toScriptHash(permitAddress);
  }
}
