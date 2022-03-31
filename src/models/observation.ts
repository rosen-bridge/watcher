import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity
export class observation {
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
}
