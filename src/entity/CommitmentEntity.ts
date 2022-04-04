import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity()
export class CommitmentEntity {
    @PrimaryColumn()
    id: number

    @Column()
    eventId: string

    @Column()
    commitment: string

    @Column()
    txId: string

    @Column()
    tokenId: string

    @Column()
    boxId: string
}
