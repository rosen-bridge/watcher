import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Block } from "./Block";

@Entity
export class Observation {
    @PrimaryGeneratedColumn()
    id: number

    @Column({
        length: 30,
    })
    fromChain: string

    @Column({
        length: 30,
    })
    toChain: string

    @Column
    toAddress: string

    @Column
    amount: string

    @Column
    fee: string

    @Column
    sourceChainTokenId: string

    @Column
    targetChainTokenId: string

    @Column
    sourceTxId: string

    @Column
    sourceBlockId: string

    @Column
    requestId: string

    @ManyToOne(() => Block, (block) => block.hash)
    block: Block
}
