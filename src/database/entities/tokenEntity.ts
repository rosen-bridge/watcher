import { Column, Entity, PrimaryColumn } from '@rosen-bridge/extended-typeorm';

@Entity()
export class TokenEntity {
  @PrimaryColumn({ type: 'varchar' })
  tokenId: string;

  @Column({ type: 'varchar' })
  tokenName: string;

  @Column({ type: 'integer' })
  decimals: number;
}
