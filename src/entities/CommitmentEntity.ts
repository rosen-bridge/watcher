import { Column, Entity, OneToOne, PrimaryColumn } from "typeorm";
import { ObservationEntity } from "./ObservationEntity";

export enum txStatus {
    SENT = 'sent',
    CREATED = 'created',
    MERGED = 'merged',
    UNUSED = 'unused'
}

@Entity()
export class CommitmentEntity {
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

    @Column()
    commitmentTxId: string

    @Column({
        type: 'simple-enum',
        enum: txStatus
    })
    flag: txStatus

    @OneToOne(
        () => ObservationEntity,
        (observation) => observation.id,
    )
    observation: ObservationEntity
}
