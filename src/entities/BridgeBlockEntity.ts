import { Column, Entity, OneToMany, PrimaryColumn } from "typeorm";
import { ObservedCommitmentEntity } from "./ObservedCommitmentEntity";
import { BoxEntity } from "./BoxEntity";

@Entity()
export class BridgeBlockEntity {
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

    @OneToMany(
        () => BoxEntity,
        (box) => box.block,
        {cascade: true,}
    )
    boxes: BoxEntity[]
}
