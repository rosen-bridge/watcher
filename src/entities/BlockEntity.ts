import { Column, Entity, OneToMany, PrimaryColumn } from "typeorm";
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
        () => ObservationEntity,
        (observation) => observation.block,
        {cascade: true,}
    )
    observations: ObservationEntity[]
}
