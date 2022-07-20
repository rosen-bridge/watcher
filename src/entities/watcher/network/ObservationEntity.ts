import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, Relation } from "typeorm";
import { BlockEntity } from "./BlockEntity";
import { TxEntity } from "./TransactionEntity";

export enum TxStatus {
    TIMED_OUT = 0,
    NOT_COMMITTED = 1,
    COMMITMENT_SENT = 2,
    COMMITTED = 3,
    REVEAL_SENT = 4,
    REVEALED = 5,
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
