import { Column, Entity, OneToOne, PrimaryColumn, Relation } from "typeorm";
import { ObservationEntity } from "./ObservationEntity";

@Entity()
export class TxEntity {
    @PrimaryColumn()
    id: number

    @Column()
    creationTime: number

    @Column()
    txId: string

    @Column()
    requestId: string

    @Column()
    txSerialized: string

    @OneToOne(
        "ObservationEntity",
        "??",
        {onDelete: 'CASCADE', nullable: true}
    )
    revealTx: Relation<ObservationEntity>
}
