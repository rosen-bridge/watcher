import {AbstractScanner} from "../../scanner/abstract-scanner";
import {CommitmentDataBase} from "../../models/commitmentModel";
import config, {IConfig} from "config";
import {Block, Commitment} from "../../objects/interfaces";
import {commitmentOrmConfig} from "../../../config/ormconfig";
import {ErgoNetworkApi} from "../network/networkApi";
import {CBlockEntity} from "../../entities/CBlockEntity";
import {CommitmentUtils} from "./utils";
import * as wasm from "ergo-lib-wasm-nodejs";

const INTERVAL: number | undefined = config.get?.('commitmentScanner.interval');

export class Scanner extends AbstractScanner<wasm.ErgoBox, wasm.Transaction, CBlockEntity, Commitment> {
    _dataBase: CommitmentDataBase;
    _networkAccess: ErgoNetworkApi;
    _config: IConfig;
    _INITIAL_HEIGHT: number;

    constructor(db: CommitmentDataBase, network: ErgoNetworkApi, config: IConfig) {
        super();
        this._dataBase = db;
        this._networkAccess = network;
        this._config = config;
        const INITIAL_HEIGHT: number | undefined = config.get?.('commitmentScanner.initialBlockHeight');
        if (typeof INITIAL_HEIGHT !== 'number') {
            throw new Error("scanner initial height doesn't set in the config!");
        } else {
            this._INITIAL_HEIGHT = INITIAL_HEIGHT;
        }
    }

    /**
     * getting block and extracting observations from the network
     * @param block
     * @return Promise<Array<Commitment | undefined>>
     */
    getBlockInformation = async (block: Block): Promise<Array<Commitment | undefined>> => {
        return (await CommitmentUtils.commitmentsAtHeight(block.hash, this._networkAccess))
            .filter(commitment => commitment !== undefined);
    }
}

/**
 * main function that runs every `SCANNER_INTERVAL` time that sets in the config
 */
export const main = async () => {
    const DB = await CommitmentDataBase.init(commitmentOrmConfig);
    const apiNetwork = new ErgoNetworkApi();
    const scanner = new Scanner(DB, apiNetwork, config);
    if (typeof INTERVAL === 'number') {
        setInterval(scanner.update, INTERVAL * 1000);
    } else {
        console.log("scanner interval doesn't set in the config");
    }
}
