import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from '@rosen-bridge/extended-typeorm';
import { PermitEntity } from '@rosen-bridge/watcher-data-extractor';

@Entity({
  name: 'revenue_entity',
})
export class RevenueEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  tokenId: string;

  @Column({ type: 'bigint' })
  amount: string;

  @ManyToOne(() => PermitEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'permitId' })
  permit: PermitEntity;
}
