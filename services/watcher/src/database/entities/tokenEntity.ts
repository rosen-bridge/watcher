import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class TokenEntity {
  @PrimaryColumn()
  tokenId: string;

  @Column()
  tokenName: string;

  @Column()
  decimal: number;
}
