import { Column, Entity, ManyToOne, PrimaryColumn, Relation } from "typeorm";
import { ObservationEntity } from "./ObservationEntity";

export enum TxType {
    COMMITMENT = 'commitment',
    TRIGGER = 'trigger',
}

@Entity()
export class TxEntity {
    @PrimaryColumn()
    id: number

    @Column()
    creationTime: number

    @Column()
    updateBlock: number

    @Column({
        type: 'simple-enum',
        enum: TxType
    })
    type: TxType

    @Column()
    txId: string

    @Column()
    txSerialized: string

    @ManyToOne(
        "ObservationEntity",
        "requestId",
        {onDelete: 'CASCADE'}
    )
    observation: Relation<ObservationEntity>

    @Column()
    deleted: boolean
}
