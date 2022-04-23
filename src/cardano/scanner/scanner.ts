import { KoiosNetwork } from "../network/koios";
import { CardanoUtils, Observation } from "./utils";
import config, { IConfig } from "config";
import { ormconfig } from "../../../config/ormconfig";
import { ScannerAbstract } from "../../scanner/scanner-abstract";
import { DataBase } from "../../models/model";
import { Block } from "../../objects/interfaces";
import { Tx, TxMetaData } from "../network/apiModelsCardano";

const INTERVAL: number | undefined = config.get?.('scanner.interval');

export class Scanner extends ScannerAbstract<Tx, TxMetaData> {
    _dataBase: DataBase;
    _networkAccess: KoiosNetwork;
    _config: IConfig;
    _INITIAL_HEIGHT: number;

    constructor(db: DataBase, network: KoiosNetwork, config: IConfig) {
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
     * getting last block and observations from the network
     * @param height
     * @return Promise<[Block, Array<Observation | undefined>]>
     */
    getBlockAndObservations = async (height: number): Promise<[Block, Array<Observation | undefined>]> => {
        const block = await this._networkAccess.getBlockAtHeight(height);
        const observations = (await CardanoUtils.observationsAtHeight(block.hash, this._networkAccess))
            .filter((observation) => {
                return observation !== undefined
            });
        return [block, observations];
    }

}

/**
 * main function that runs every `SCANNER_INTERVAL` time that sets in the config
 */
export const main = async () => {
    const DB = await DataBase.init(ormconfig);
    const koiosNetwork = new KoiosNetwork();
    const scanner = new Scanner(DB, koiosNetwork, config);
    if (typeof INTERVAL === 'number') {
        setInterval(scanner.update, INTERVAL * 1000);
    } else {
        console.log("scanner interval doesn't set in the config");
    }

}
