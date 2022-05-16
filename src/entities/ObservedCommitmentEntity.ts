import {Column, Entity, ManyToOne, PrimaryColumn} from "typeorm";
import {CBlockEntity} from "./CBlockEntity";

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

    @Column()
    spendHeight: number

    @Column()
    eventTriggerBoxId: string

    @ManyToOne(
        () => CBlockEntity,
        (block) => block.height,
        {onDelete: 'CASCADE',}
    )
    block: CBlockEntity
}
