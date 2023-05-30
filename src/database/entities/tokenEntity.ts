import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity()
export class TokenEntity {
  @PrimaryColumn()
  tokenId: string;

  @Column()
  tokenName: string;
}
