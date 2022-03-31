import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity
export class Block{
    @PrimaryColumn()
    height:number

    @Column({
        length:64
    })
    hash:string
}
