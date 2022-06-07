import { Column, Entity, ManyToOne, PrimaryColumn } from "typeorm";
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
    block: CBlockEntity

    @ManyToOne(
        () => CBlockEntity,
        (block) => block.height,
        {onDelete: 'SET NULL', nullable: true}
    )
    spendBlock: CBlockEntity

    @Column({nullable: true})
    eventTriggerBoxId: string
}
