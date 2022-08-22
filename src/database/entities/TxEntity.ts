import { Column, Entity, ManyToOne, OneToOne, PrimaryColumn, Relation } from "typeorm";
import { ObservationEntity } from "@rosen-bridge/observation-extractor"

export enum TxType{
    COMMITMENT = 'commitment',
    TRIGGER = 'trigger',
}

@Entity()
export class TxEntity{
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
        "id",
    )
    observation: Relation<ObservationEntity>

    @Column()
    deleted: boolean
}
