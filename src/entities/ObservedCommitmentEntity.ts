import {Column, Entity, ManyToOne, PrimaryColumn, Relation} from "typeorm";
import { CBlockEntity } from "./CBlockEntity";

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
        () => CBlockEntity,
        (block) => block.height,
        {onDelete: 'CASCADE',}
    )
    block: Relation<CBlockEntity>

    @ManyToOne(
        () => CBlockEntity,
        (block) => block.height,
        {onDelete: 'SET NULL', nullable: true}
    )
    spendBlock: Relation<CBlockEntity>

    @Column({nullable: true})
    eventTriggerBoxId: string
}
