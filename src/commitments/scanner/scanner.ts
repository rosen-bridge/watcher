import {AbstractScanner} from "../../scanner/abstractScanner";
import {CommitmentDataBase} from "../models/commitmentModel";
import config, {IConfig} from "config";
import {Block, Commitment} from "../../objects/interfaces";
import {commitmentOrmConfig} from "../../../config/commitmentOrmConfig";
import {CommitmentNetworkApi} from "../network/networkApi";
import {CBlockEntity} from "../../entities/CBlockEntity";
import {CommitmentUtils} from "./utils";
import {contracts} from "../../contracts/contracts";

const INTERVAL: number | undefined = config.get?.('commitmentScanner.interval');

export type CommitmentInformation = {
    newCommitments: Array<Commitment>
    updatedCommitments: Array<string>
}

export class Scanner extends AbstractScanner<CBlockEntity, CommitmentInformation> {
    _dataBase: CommitmentDataBase;
    _networkAccess: CommitmentNetworkApi;
    _config: IConfig;
    _INITIAL_HEIGHT: number;

    constructor(db: CommitmentDataBase, network: CommitmentNetworkApi, config: IConfig) {
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
     * getting block and extracting new commitments and old spent commitments from the specified block
     * @param block
     * @return Promise<Array<CommitmentInformation>>
     */
    getBlockInformation = async (block: Block): Promise<CommitmentInformation> => {
        const txs = await this._networkAccess.getBlockTxs(block.hash);
        const newCommitments = (await CommitmentUtils.commitmentsAtHeight(txs))
        const updatedCommitments = await CommitmentUtils.updatedCommitmentsAtHeight(txs, this._dataBase, newCommitments.map(commitment => commitment.commitmentBoxId))
        // TODO: Add eventTrigger box id to updated commitments
        return {
            newCommitments: newCommitments,
            updatedCommitments: updatedCommitments
        }
    }

    /**
     * removes old spent commitments older than block height limit config
     */
    removeOldCommitments = async () => {
        const heightLimit: number = config.get?.('commitmentScanner.heightLimit');
        const currentHeight = await this._networkAccess.getCurrentHeight()
        const commitments = await this._dataBase.getOldSpentCommitments(currentHeight - heightLimit)
        await this._dataBase.deleteCommitments(commitments.map(commitment => commitment.commitmentBoxId))
    }
}

/**
 * main function that runs every `SCANNER_INTERVAL` time that sets in the config
 */
export const commitmentMain = async () => {
    const DB = await CommitmentDataBase.init(commitmentOrmConfig);
    const apiNetwork = new CommitmentNetworkApi();
    const scanner = new Scanner(DB, apiNetwork, config);
    await contracts.init()
    if (typeof INTERVAL === 'number') {
        setInterval(scanner.update, INTERVAL * 10000);
        setInterval(scanner.removeOldCommitments, INTERVAL * 1000);
    } else {
        console.log("scanner interval doesn't set in the config");
    }
}
