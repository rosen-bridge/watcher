import { KoiosNetwork } from "../network/koios";
import { CardanoUtils } from "./utils";
import config, { IConfig } from "config";
import { cardanoOrmConfig } from "../../../config/ormconfig";
import { AbstractScanner } from "../../scanner/abstract-scanner";
import { NetworkDataBase } from "../../models/networkModel";
import { Block, Observation } from "../../objects/interfaces";
import { BlockEntity } from "../../entities/BlockEntity";

const INTERVAL: number | undefined = config.get?.('scanner.interval');

export class Scanner extends AbstractScanner<BlockEntity, Array<Observation>> {
    _dataBase: NetworkDataBase;
    _networkAccess: KoiosNetwork;
    _config: IConfig;
    _INITIAL_HEIGHT: number;

    constructor(db: NetworkDataBase, network: KoiosNetwork, config: IConfig) {
        super();
        this._dataBase = db;
        this._networkAccess = network;
        this._config = config;
        const INITIAL_HEIGHT: number | undefined = config.get?.('scanner.initialBlockHeight');
        if (typeof INITIAL_HEIGHT !== 'number') {
            throw new Error("scanner initial height doesn't set in the config!");
        } else {
            this._INITIAL_HEIGHT = INITIAL_HEIGHT;
        }

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
    if (typeof INTERVAL === 'number') {
        setInterval(scanner.update, INTERVAL * 1000);
    } else {
        console.log("scanner interval doesn't set in the config");
    }

}
