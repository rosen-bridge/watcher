import { Column, Entity, ManyToOne, PrimaryColumn, Relation } from "typeorm";
import { BridgeBlockEntity } from "./BridgeBlockEntity";

export enum BoxType {
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

    @Column({type: 'bigint'})
    value: string

    @Column({
        type: 'simple-enum',
        enum: BoxType
    })
    type: BoxType

    @Column()
    boxJson: string

    @ManyToOne(
        "BridgeBlockEntity",
        "height",
        {onDelete: 'CASCADE'}
    )
    block: Relation<BridgeBlockEntity>

    @ManyToOne(
        "BridgeBlockEntity",
        "height",
        {onDelete: 'SET NULL', nullable: true}
    )
    spendBlock: Relation<BridgeBlockEntity>
}
