import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { PermitEntity } from '@rosen-bridge/watcher-data-extractor';

@Entity({
  name: 'revenue_entity',
})
export class RevenueEntity {
  @PrimaryColumn()
  id: number;

  @Column()
  tokenId: string;

  @Column({ type: 'bigint' })
  amount: string;

  @ManyToOne(() => PermitEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'permitId' })
  permit: PermitEntity;
}
