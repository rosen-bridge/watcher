import { Column, Entity, ManyToOne, PrimaryColumn } from "typeorm";
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
    // TODO: store the rwt count

    @Column({
        type: 'simple-enum',
        enum: BoxType
    })
    type: BoxType

    @Column()
    boxJson: string

    @ManyToOne(
        () => BridgeBlockEntity,
        (block) => block.height,
        {onDelete: 'CASCADE'}
    )
    block: BridgeBlockEntity

    @ManyToOne(
        () => BridgeBlockEntity,
        (block) => block.height,
        {onDelete: 'SET NULL', nullable: true}
    )
    spendBlock: BridgeBlockEntity
}
