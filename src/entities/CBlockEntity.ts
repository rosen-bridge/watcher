import { Column, Entity, OneToMany, PrimaryColumn } from "typeorm";
import { ObservedCommitmentEntity } from "./ObservedCommitmentEntity";

@Entity()
export class CBlockEntity {
    @PrimaryColumn()
    height: number

    @Column({
        length: 64,
        unique: true
    })
    hash: string

    @OneToMany(
        () => ObservedCommitmentEntity,
        (commitment) => commitment.block,
        {cascade: true,}
    )
    commitments: ObservedCommitmentEntity[]
}
