import { Column, Entity, OneToMany, PrimaryColumn } from "typeorm";
import { Observation } from "./Observation";

@Entity()
export class BlockEntity {
    @PrimaryColumn()
    height: number

    @Column({
        length: 64,
    })
    hash: string

    @OneToMany(() => Observation, (observations) => observations.block)
    observations: Observation[]
}
