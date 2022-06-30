import { Column, Entity, OneToMany, PrimaryColumn, Relation } from "typeorm";
import { ErgoObservationEntity } from "./ErgoObservationEntity";

@Entity()
export class ErgoBlockEntity {
    @PrimaryColumn()
    height: number

    @Column({
        length: 64,
        unique: true
    })
    hash: string

    @OneToMany(
        "ErgoObservationEntity",
        "block",
        {cascade: true,}
    )
    observations: Relation<ErgoObservationEntity>[]
}
