import {
  Column,
  Entity,
  Relation,
  PrimaryGeneratedColumn,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { ObservationEntity } from '@rosen-bridge/observation-extractor';

enum TxStatus {
  TIMED_OUT = 'timeout',
  NOT_COMMITTED = 'not_committed',
  COMMITMENT_SENT = 'commitment_sent',
  COMMITTED = 'committed',
  REVEAL_SENT = 'reveal_sent',
  REVEALED = 'revealed',
}

const SortedTxStatus = [
  TxStatus.TIMED_OUT,
  TxStatus.NOT_COMMITTED,
  TxStatus.COMMITMENT_SENT,
  TxStatus.COMMITTED,
  TxStatus.REVEAL_SENT,
  TxStatus.REVEALED,
];

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

export { TxStatus, ObservationStatusEntity, SortedTxStatus };
