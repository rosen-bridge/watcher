import { Column, Entity, OneToMany, PrimaryColumn } from "typeorm";
import { Observation } from "./observation";

@Entity
export class Block {
    @PrimaryColumn()
    height: number

    @Column
    hash: string

    @OneToMany(() => Observation, (observations) => observations.block)
    observations: Observation[]
}
