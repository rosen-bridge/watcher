import { Column, Entity, OneToOne, PrimaryColumn, Relation } from "typeorm";
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
    updateTime: number

    @Column({
        type: 'simple-enum',
        enum: TxType
    })
    type: TxType

    @Column()
    txId: string

    @Column()
    txSerialized: string

    @OneToOne(
        "ObservationEntity",
        "requestId",
        {onDelete: 'CASCADE'}
    )
    observation: Relation<ObservationEntity>

    @Column()
    deleted: boolean
}
