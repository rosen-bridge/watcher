import { BridgeDataBase } from "../../src/database/models/bridgeModel";
import { DataSource } from "typeorm";
import { bridgeEntities } from "../../src/database/entities";

export const loadBridgeDataBase = async (name: string): Promise<BridgeDataBase> => {
    const ormConfig = new DataSource({
        type: "sqlite",
        database: `./sqlite/watcher-test-${name}.sqlite`,
        entities: bridgeEntities,
        synchronize: true,
        logging: false,
    });
    return await BridgeDataBase.init(ormConfig);
}