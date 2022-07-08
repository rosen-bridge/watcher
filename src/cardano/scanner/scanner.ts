import { KoiosNetwork } from "../network/koios";
import { CardanoUtils } from "./utils";
import { IConfig } from "config";
import { AbstractScanner } from "../../scanner/abstractScanner";
import { NetworkDataBase } from "../../models/networkModel";
import { Block, Observation } from "../../objects/interfaces";
import { BlockEntity } from "../../entities/watcher/network/BlockEntity";
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

