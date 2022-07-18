import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, Relation } from "typeorm";
import { BlockEntity } from "./BlockEntity";
import { TxEntity } from "./TransactionEntity";

export enum TxStatus {
    NOT_COMMITTED = 0,
    COMMITMENT_SENT = 1,
    COMMITTED = 2,
    REVEAL_SENT = 3,
    REVEALED = 4,
}

@Entity()
export class ObservationEntity{
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

    @Column()
    fromAddress: string

    @Column()
    toAddress: string

    @Column()
    amount: string

    @Column()
    networkFee: string

    @Column()
    bridgeFee: string

    @Column()
    sourceChainTokenId: string

    @Column()
    targetChainTokenId: string

    @Column()
    sourceTxId: string

    @Column()
    sourceBlockId: string

    @Column({unique: true})
    requestId: string

    @ManyToOne(
        "BlockEntity",
        "height",
        {onDelete: 'CASCADE',}
    )
    block: Relation<BlockEntity>

    @OneToMany(
        "TxEntity",
        "txId",
        {cascade: true,}
    )
    txs: Relation<TxEntity>

    @Column({
        type: 'simple-enum',
        enum: TxStatus
    })
    status: TxStatus
}
