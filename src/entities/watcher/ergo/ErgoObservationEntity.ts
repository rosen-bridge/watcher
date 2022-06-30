import {Column, Entity, ManyToOne, OneToOne, PrimaryGeneratedColumn, Relation} from "typeorm";
import { ErgoBlockEntity } from "./ErgoBlockEntity";

@Entity()
export class ErgoObservationEntity {
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
    fee: string

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
        "ErgoBlockEntity",
        "height",
        {onDelete: 'CASCADE',}
    )
    block: Relation<ErgoBlockEntity>

    @Column({nullable: true})
    commitmentBoxId: string
}
