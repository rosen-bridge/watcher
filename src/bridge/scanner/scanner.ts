import { AbstractScanner } from "../../scanner/abstractScanner";
import { BridgeDataBase } from "../models/bridgeModel";
import { IConfig } from "config";
import { Block, Commitment, SpecialBox, SpentBox } from "../../objects/interfaces";
import { ErgoNetworkApi } from "../network/networkApi";
import { BridgeBlockEntity } from "../../entities/watcher/bridge/BridgeBlockEntity";
import { CommitmentUtils } from "./utils";
import { ErgoConfig } from "../../config/config";
import { rosenConfig } from "../../config/rosenConfig";
import { Transaction } from "../../api/Transaction";

const ergoConfig = ErgoConfig.getConfig();

export type BridgeBlockInformation = {
    newCommitments: Array<Commitment>
    updatedCommitments: Array<SpentBox>
    newBoxes: Array<SpecialBox>
    spentBoxes: Array<string>
}

export class Scanner extends AbstractScanner<BridgeBlockEntity, BridgeBlockInformation>{
    _dataBase: BridgeDataBase;
    _networkAccess: ErgoNetworkApi;
    _config: IConfig;
    _initialHeight: number;
    _widApi: Transaction

    constructor(db: BridgeDataBase, network: ErgoNetworkApi, config: IConfig, api: Transaction) {
        super();
        this._dataBase = db;
        this._networkAccess = network;
        this._config = config;
        this._initialHeight = ergoConfig.commitmentInitialHeight;
        this._widApi = api
    }

    /**
     * getting block and extracting new bridge and old spent bridge from the specified block
     * @param block
     * @return Promise<Array<BridgeBlockInformation>>
     */
    getBlockInformation = async (block: Block): Promise<BridgeBlockInformation> => {
        if(!this._widApi.watcherWID) {
            console.log("Watcher WID is not set, can not run watcher tasks.")
            throw new Error("WID not found")
        }
        const txs = await this._networkAccess.getBlockTxs(block.hash);
        const newCommitments = (await CommitmentUtils.extractCommitments(txs))
        const updatedCommitments = await CommitmentUtils.updatedCommitments(
            txs,
            this._dataBase,
            newCommitments.map(commitment => commitment.commitmentBoxId)
        )
        const newBoxes = await CommitmentUtils.extractSpecialBoxes(
            txs,
            rosenConfig.watcherPermitAddress,
            ergoConfig.address,
            this._widApi.watcherWID
        )
        const spentBoxes = await CommitmentUtils.spentSpecialBoxes(
            txs,
            this._dataBase,
            newBoxes.map(box => box.boxId)
        )
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

