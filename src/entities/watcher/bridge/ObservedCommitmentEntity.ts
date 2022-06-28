import {Column, Entity, ManyToOne, PrimaryColumn, Relation} from "typeorm";
import { BridgeBlockEntity } from "./BridgeBlockEntity";

export enum SpendReason {
    MERGE = "merge",
    REDEEM = "redeem"
}

@Entity()
export class ObservedCommitmentEntity {
    @PrimaryColumn()
    id: number

    @Column()
    eventId: string

    @Column()
    commitment: string

    @Column()
    WID: string

    @Column()
    commitmentBoxId: string

    @ManyToOne(
        "BridgeBlockEntity",
        "height",
        {onDelete: 'CASCADE',}
    )
    block: Relation<BridgeBlockEntity>

    @ManyToOne(
        "BridgeBlockEntity",
        "height",
        {onDelete: 'SET NULL', nullable: true}
    )
    spendBlock: Relation<BridgeBlockEntity>

    @Column({nullable: true})
    spendReason: string
}
