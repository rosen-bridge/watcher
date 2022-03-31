import { Column, Entity, OneToMany, PrimaryColumn } from "typeorm";
import { Observation } from "./observation";

@Entity
export class Block {
    @PrimaryColumn()
    height: number

    @Column({
        length: 64
    })

    @OneToMany(() => Observation, (hash) => hash.block)
    hash: string
}
