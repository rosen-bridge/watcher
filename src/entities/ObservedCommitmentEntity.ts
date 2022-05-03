import {Column, Entity, ManyToOne, PrimaryColumn} from "typeorm";
import {BlockEntity} from "./BlockEntity";

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
        () => BlockEntity,
        (block) => block.height,
        {onDelete: 'CASCADE',}
    )
    block: BlockEntity
}