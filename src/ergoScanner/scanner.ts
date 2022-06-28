import { AbstractScanner } from "../scanner/abstractScanner";
import { BlockEntity } from "../entities/BlockEntity";
import { Block, Observation } from "../objects/interfaces";
import { NetworkDataBase } from "../models/networkModel";
import config, { IConfig } from "config";
import { ErgoConfig } from "../config/config";
import { ErgoUtils } from "./utils";
import { ErgoNetworkApi } from "../bridge/network/networkApi";
import { cardanoOrmConfig } from "../../config/ormconfig";
import { KoiosNetwork } from "../cardano/network/koios";
import { ergoOrmConfig } from "../../config/ergoOrmConfig";

const ergoConfig = ErgoConfig.getConfig();

export class Scanner extends AbstractScanner<BlockEntity, Array<Observation>> {
    _dataBase: NetworkDataBase;
    _networkAccess: ErgoNetworkApi;
    _config: IConfig;
    _initialHeight: number;

    constructor(db: NetworkDataBase, network: ErgoNetworkApi, config: IConfig) {
        super();
        this._dataBase = db;
        this._networkAccess = network;
        this._config = config;
        this._initialHeight = ergoConfig.initialHeight;
    }

    /**
     * getting block and extracting observations from the network
     * @param block
     * @return Promise<Array<Observation | undefined>>
     */
    getBlockInformation = async (block: Block): Promise<Array<Observation>> => {
        return (await ErgoUtils.observationsAtHeight(block.hash, this._networkAccess))
    }

}

/**
 * main function that runs every `SCANNER_INTERVAL` time that sets in the config
 */
export const main = async () => {
    const DB = await NetworkDataBase.init(ergoOrmConfig);
    const ergoNetwork = new ErgoNetworkApi();
    const scanner = new Scanner(DB, ergoNetwork, config);
    setInterval(scanner.update, 10 * 1000);
}
