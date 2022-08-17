import { DataSource, ViewColumn, ViewEntity } from "typeorm";
import { ObservationStatusEntity } from "./ObservationStatusEntity";


@ViewEntity({
    expression: (dataSource: DataSource) =>
        dataSource
            .createQueryBuilder()
            .select("ObservationStatusEntity.status", "status")
            .addSelect("ObservationEntity.block", "block")
            .addSelect("ObservationEntity.height", "height")
            .addSelect("ObservationEntity.fromChain", "fromChain")
            .addSelect("ObservationEntity.toChain", "toChain")
            .addSelect("ObservationEntity.fromAddress", "fromAddress")
            .addSelect("ObservationEntity.toAddress", "toAddress")
            .addSelect("ObservationEntity.amount", "amount")
            .addSelect("ObservationEntity.networkFee", "networkFee")
            .addSelect("ObservationEntity.bridgeFee", "bridgeFee")
            .addSelect("ObservationEntity.sourceChainTokenId", "sourceChainTokenId")
            .addSelect("ObservationEntity.targetChainTokenId", "targetChainTokenId")
            .addSelect("ObservationEntity.sourceTxId", "sourceTxId")
            .addSelect("ObservationEntity.sourceBlockId", "sourceBlockId")
            .addSelect("ObservationEntity.requestId", "requestId")
            .addSelect("ObservationEntity.extractor", "extractor")
            .addSelect("ObservationEntity.id", "id")
            .from("ObservationStatusEntity", "ObservationStatusEntity")
            .leftJoin("ObservationEntity", "ObservationEntity", "ObservationEntity.id = ObservationStatusEntity.id"),
})

class ObservationStatusViewEntity{
    @ViewColumn()
    id: number

    @ViewColumn()
    block: string

    @ViewColumn()
    height: number

    @ViewColumn()
    fromChain: string

    @ViewColumn()
    toChain: string

    @ViewColumn()
    fromAddress: string

    @ViewColumn()
    toAddress: string

    @ViewColumn()
    amount: string

    @ViewColumn()
    networkFee: string

    @ViewColumn()
    bridgeFee: string

    @ViewColumn()
    sourceChainTokenId: string

    @ViewColumn()
    targetChainTokenId: string

    @ViewColumn()
    sourceTxId: string

    @ViewColumn()
    sourceBlockId: string

    @ViewColumn()
    requestId: string

    @ViewColumn()
    extractor: string

    @ViewColumn()
    status: number
}

export { ObservationStatusViewEntity }
