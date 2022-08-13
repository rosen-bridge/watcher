import { Column, Entity, PrimaryColumn } from "typeorm";

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
    type: TxType

    @Column()
    txId: string

    @Column()
    txSerialized: string

    @Column()
    requestId:string


    @Column()
    deleted: boolean
}
