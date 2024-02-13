// TODO: WILL BE REMOVED AFTER ADDING COLLATERAL EXTRACTOR

import { Column, PrimaryGeneratedColumn } from 'typeorm';

export class CollateralEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  wid: string;

  @Column()
  rwtCount: bigint;

  @Column()
  boxId: string;

  @Column()
  createBlock: string;

  @Column()
  creationHeight: number;

  @Column()
  serialized: string;

  @Column({ nullable: true, type: 'text' })
  spendBlock?: string | null;

  @Column({ nullable: true })
  spendHeight?: number;

  @Column()
  extractor: string;
}
