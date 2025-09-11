import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
} from '@rosen-bridge/extended-typeorm';
import { ObservationEntity } from '@rosen-bridge/abstract-observation-extractor';

export enum TxType {
  COMMITMENT = 'commitment',
  TRIGGER = 'trigger',
  DETACH = 'detach',
  REDEEM = 'redeem',
  PERMIT = 'permit',
  REWARD = 'reward',
}

@Entity()
export class TxEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  creationTime: number;

  @Column({ type: 'integer' })
  updateBlock: number;

  @Column({
    type: 'simple-enum',
    enum: TxType,
  })
  type: TxType;

  @Column({ type: 'varchar' })
  txId: string;

  @Column({ type: 'varchar' })
  txSerialized: string;

  @ManyToOne('ObservationEntity', 'id', { nullable: true })
  observation?: Relation<ObservationEntity>;

  @Column({ type: 'boolean' })
  deleted: boolean;

  @Column({ type: 'boolean', default: true })
  isValid: boolean;
}
