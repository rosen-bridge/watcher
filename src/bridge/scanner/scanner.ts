import { AbstractScanner } from "../../scanner/abstractScanner";
import { BridgeDataBase } from "../models/bridgeModel";
import config, { IConfig } from "config";
import { Block, Commitment, SpecialBox } from "../../objects/interfaces";
import { commitmentOrmConfig } from "../../../config/commitmentOrmConfig";
import { ErgoNetworkApi } from "../network/networkApi";
import { BridgeBlockEntity } from "../../entities/watcher/commitment/BridgeBlockEntity";
import { CommitmentUtils } from "./utils";
import { ErgoConfig } from "../../config/config";
import { rosenConfig } from "../../config/rosenConfig";
import { NetworkDataBase } from "../../models/networkModel";

const ergoConfig = ErgoConfig.getConfig();

export type BridgeBlockInformation = {
    newCommitments: Array<Commitment>
    updatedCommitments: Array<string>
    newBoxes: Array<SpecialBox>
    spentBoxes: Array<string>
}

export class Scanner extends AbstractScanner<BridgeBlockEntity, BridgeBlockInformation>{
    _dataBase: BridgeDataBase;
    _dataBase2: NetworkDataBase;
    _networkAccess: ErgoNetworkApi;
    _config: IConfig;
    _initialHeight: number;

    constructor(db: BridgeDataBase, network: ErgoNetworkApi, config: IConfig) {
        super();
        this._dataBase = db;
        this._networkAccess = network;
        this._config = config;
        this._initialHeight = ergoConfig.commitmentInitialHeight;
    }

    /**
     * getting block and extracting new bridge and old spent bridge from the specified block
     * @param block
     * @return Promise<Array<BridgeBlockInformation>>
     */
    getBlockInformation = async (block: Block): Promise<BridgeBlockInformation> => {
        const txs = await this._networkAccess.getBlockTxs(block.hash);
        const newCommitments = (await CommitmentUtils.extractCommitments(txs))
        const updatedCommitments = await CommitmentUtils.updatedCommitments(txs, this._dataBase, newCommitments.map(commitment => commitment.commitmentBoxId))
        // TODO: Add eventTrigger box id to updated bridge
        // TODO: fix config
        const newBoxes = await CommitmentUtils.extractSpecialBoxes(txs, rosenConfig.watcherPermitAddress, config.get?.("ergo.address"), config.get?.("ergo.WID"))
        const spentBoxes = await CommitmentUtils.spentSpecialBoxes(txs, this._dataBase, [])
        return {
            newCommitments: newCommitments,
            updatedCommitments: updatedCommitments,
            newBoxes: newBoxes,
            spentBoxes: spentBoxes
        }
    }

    /**
     * removes old spent bridge older than block height limit config
     */
    removeOldCommitments = async () => {
        const heightLimit = ergoConfig.commitmentHeightLimit;
        const currentHeight = await this._networkAccess.getCurrentHeight()
        const commitments = await this._dataBase.getOldSpentCommitments(currentHeight - heightLimit)
        await this._dataBase.deleteCommitments(commitments.map(commitment => commitment.commitmentBoxId))
    }
}

/**
 * main function that runs every `SCANNER_INTERVAL` time that sets in the config
 */
export const commitmentMain = async () => {
    const DB = await BridgeDataBase.init(commitmentOrmConfig);
    const apiNetwork = new ErgoNetworkApi();
    const scanner = new Scanner(DB, apiNetwork, config);
    setInterval(scanner.update, ergoConfig.commitmentInterval * 1000);
    setInterval(scanner.removeOldCommitments, ergoConfig.commitmentInterval * 1000);

}
