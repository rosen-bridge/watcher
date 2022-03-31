import { Column, Entity, OneToMany, PrimaryColumn } from "typeorm";
import { Observation } from "./observation";

@Entity
export class Block {
    @PrimaryColumn()
    height: number

    @OneToMany(() => Observation, (hash) => hash.block)
    hash: string
}
