import { Column, Entity, ManyToOne, PrimaryColumn, Relation } from "typeorm";
import { ObservationEntity } from "@rosen-bridge/observation-extractor";

export enum TxTypeTemp {
    COMMITMENT = 'commitment',
    TRIGGER = 'trigger',
}

@Entity()
export class TxEntityTemp {
    @PrimaryColumn()
    id: number

    @Column()
    creationTime: number

    @Column()
    updateBlock: number

    @Column({
        type: 'simple-enum',
        enum: TxTypeTemp
    })
    type: TxTypeTemp

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
