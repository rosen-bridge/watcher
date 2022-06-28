
import {Column, Entity, ManyToOne, PrimaryGeneratedColumn, Relation} from "typeorm";
import { BlockEntity } from "./BlockEntity";

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

    @Column({nullable: true})
    commitmentBoxId: string
}
