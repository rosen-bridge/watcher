import { DataSource, ViewColumn, ViewEntity } from "typeorm";
import { ObservationEntity } from "@rosen-bridge/observation-extractor";
import { ObservationStatusEntity, TxStatus } from "./ObservationStatusEntity";


@ViewEntity({
    expression: (dataSource: DataSource) =>
        dataSource
            .createQueryBuilder()
            .select("ObservationStatusEntity.status", "status")
            .addSelect("ObservationEntity.block", "block")
            .addSelect("ObservationEntity.height", "height")
            .from(ObservationStatusEntity, "ObservationStatusEntity")
            .leftJoin(ObservationEntity, "ObservationEntity", "ObservationEntity.id = ObservationStatusEntity.id"),

})
class BlockStatusViewEntity{
    @ViewColumn()
    id: number

    @ViewColumn()
    block: string

    @ViewColumn()
    height: number

    @ViewColumn()
    status: number
}

export { BlockStatusViewEntity }
