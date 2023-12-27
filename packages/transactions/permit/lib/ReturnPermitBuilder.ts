import { AbstractLogger } from '@rosen-bridge/abstract-logger';
import { RWTRepo } from '@rosen-bridge/rwt-repo';

export class ReturnPermitBuilder {
  constructor(
    private permitAddress: string,
    private collateralAddress: string,
    private changeAddress: string,
    private rsn: string,
    private rwt: string,
    private txFee: string,
    private rwtRepo: RWTRepo,
    private logger?: AbstractLogger
  ) {}
}
