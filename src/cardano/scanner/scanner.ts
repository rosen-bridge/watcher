import { KoiosNetwork } from "../network/koios";
import { CardanoUtils } from "./utils";
import config, { IConfig } from "config";
import { cardanoOrmConfig } from "../../../config/ormconfig";
import { AbstractScanner } from "../../scanner/abstractScanner";
import { NetworkDataBase } from "../../models/networkModel";
import { Block, Observation } from "../../objects/interfaces";
import { BlockEntity } from "../../entities/BlockEntity";
import { CardanoConfig } from "../../config/config";

const cardanoConfig = CardanoConfig.getConfig();

export class Scanner extends AbstractScanner<BlockEntity, Array<Observation>>{
    _dataBase: NetworkDataBase;
    _networkAccess: KoiosNetwork;
    _config: IConfig;
    _initialHeight: number;

    constructor(db: NetworkDataBase, network: KoiosNetwork, config: IConfig) {
        super();
        this._dataBase = db;
        this._networkAccess = network;
        this._config = config;
        this._initialHeight = cardanoConfig.initialHeight;
    }

    /**
     * getting block and extracting observations from the network
     * @param block
     * @return Promise<Array<Observation | undefined>>
     */
    getBlockInformation = async (block: Block): Promise<Array<Observation>> => {
        return (await CardanoUtils.observationsAtHeight(block.hash, this._networkAccess))
    }

}

/**
 * main function that runs every `SCANNER_INTERVAL` time that sets in the config
 */
export const main = async () => {
    const DB = await NetworkDataBase.init(cardanoOrmConfig);
    const koiosNetwork = new KoiosNetwork();
    const scanner = new Scanner(DB, koiosNetwork, config);
    setInterval(scanner.update, cardanoConfig.interval * 1000);
}
