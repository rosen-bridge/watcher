import { Column, Entity, OneToMany, PrimaryColumn, Relation } from "typeorm";
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
        "ObservedCommitmentEntity",
        "block",
        {cascade: true,}
    )
    commitments: Relation<ObservedCommitmentEntity>[]

    @OneToMany(
        "BoxEntity",
        "block",
        {cascade: true,}
    )
    boxes: Relation<BoxEntity>[]
}
