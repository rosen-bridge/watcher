import { Column, Entity, OneToMany, PrimaryColumn, Relation } from "typeorm";
import { ObservationEntity } from "./ObservationEntity";

@Entity()
export class BlockEntity {
    @PrimaryColumn()
    height: number

    @Column({
        length: 64,
        unique: true
    })
    hash: string

    @OneToMany(
        "ObservationEntity",
        "block",
        {cascade: true,}
    )
    observations: Relation<ObservationEntity>[]
}
