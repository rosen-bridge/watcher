import { Column, Entity, ManyToOne, PrimaryColumn } from "typeorm";
import { CBlockEntity } from "./CBlockEntity";

export enum boxType {
    PERMIT = 'permit',
    WID = 'wid',
    PLAIN = 'plain'
}

@Entity()
export class BoxEntity {
    @PrimaryColumn()
    id: number

    @Column()
    boxId: string

    @Column()
    value: bigint

    @Column({
        type: 'simple-enum',
        enum: boxType
    })
    type: boxType

    @Column()
    boxJson: string

    @ManyToOne(
        () => CBlockEntity,
        (block) => block.height,
        {onDelete: 'CASCADE'}
    )
    block: CBlockEntity

    @ManyToOne(
        () => CBlockEntity,
        (block) => block.height,
        {onDelete: 'SET NULL', nullable: true}
    )
    spendBlock: CBlockEntity
}
