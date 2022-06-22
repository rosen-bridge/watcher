import { Column, Entity, ManyToOne, PrimaryColumn } from "typeorm";
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
        () => BridgeBlockEntity,
        (block) => block.height,
        {onDelete: 'CASCADE',}
    )
    block: BridgeBlockEntity

    @ManyToOne(
        () => BridgeBlockEntity,
        (block) => block.height,
        {onDelete: 'SET NULL', nullable: true}
    )
    spendBlock: BridgeBlockEntity

    @Column({nullable: true})
    spendReason: string
}
