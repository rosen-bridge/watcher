import {AbstractScanner} from "../../scanner/abstract-scanner";
import {CommitmentDataBase} from "../../models/commitmentModel";
import config, {IConfig} from "config";
import {Block, Commitment} from "../../objects/interfaces";
import {commitmentOrmConfig} from "../../../config/ormconfig";
import {ErgoNetworkApi} from "../network/networkApi";
import {CBlockEntity} from "../../entities/CBlockEntity";
import {CommitmentUtils} from "./utils";

const INTERVAL: number | undefined = config.get?.('commitmentScanner.interval');

export class Scanner extends AbstractScanner<CBlockEntity, Commitment> {
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

    /**
     * removes old spent commitments older than block height limit config
     */
    removeOldCommitments = async () => {
        const heightLimit: number = config.get?.('commitmentScanner.heightLimit');
        const currentHeight = (await this._networkAccess.getCurrentHeight()).block_height
        const commitments = await this._dataBase.getOldCommitments(currentHeight - heightLimit)
        const ids = commitments.filter(commitment => {
            this._networkAccess.boxIsSpent(commitment.commitmentBoxId)
        }).map(commitments => commitments.commitmentBoxId)
        await this._dataBase.deleteCommitments(ids)
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
        setInterval(scanner.removeOldCommitments, INTERVAL * 1000);
    } else {
        console.log("scanner interval doesn't set in the config");
    }
}
