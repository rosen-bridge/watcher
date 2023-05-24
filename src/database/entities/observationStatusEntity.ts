import {
  Column,
  Entity,
  OneToOne,
  Relation,
  PrimaryGeneratedColumn,
  JoinColumn,
} from 'typeorm';
import { ObservationEntity } from '@rosen-bridge/observation-extractor';

enum TxStatus {
  TIMED_OUT = 0,
  NOT_COMMITTED = 1,
  COMMITMENT_SENT = 2,
  COMMITTED = 3,
  REVEAL_SENT = 4,
  REVEALED = 5,
  REDEEM_SENT = 6,
  REDEEMED = 7,
}

@Entity()
class ObservationStatusEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne('ObservationEntity', 'id')
  @JoinColumn()
  observation: Relation<ObservationEntity>;

  @Column({
    type: 'simple-enum',
    enum: TxStatus,
  })
  status: TxStatus;
}

export { TxStatus, ObservationStatusEntity };
