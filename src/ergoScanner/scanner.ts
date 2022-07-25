import { AbstractScanner } from "../scanner/abstractScanner";
import { BlockEntity } from "../entities/watcher/network/BlockEntity";
import { Block, Observation } from "../objects/interfaces";
import { NetworkDataBase } from "../models/networkModel";
import { ErgoScannerConfig } from "../config/config";
import { ErgoNetworkApi } from "../bridge/network/networkApi";
import { NodeOutputBox, NodeTransaction } from "../bridge/network/ergoApiModels";
import { decodeCollColl } from "../ergo/utils";
import { Address } from "ergo-lib-wasm-nodejs";
import { Buffer } from "buffer";
import { rosenConfig } from "../config/rosenConfig";
import { blake2b } from "blakejs";

const ergoScannerConfig = ErgoScannerConfig.getConfig();

export class ErgoScanner extends AbstractScanner<BlockEntity, Array<Observation>> {
    _dataBase: NetworkDataBase;
    _networkAccess: ErgoNetworkApi;
    _initialHeight: number;

    constructor(db: NetworkDataBase, network: ErgoNetworkApi) {
        super();
        this._dataBase = db;
        this._networkAccess = network;
        this._initialHeight = ergoScannerConfig.initialHeight;
    }

    /**
     * Should return the target token hex string id
     * @param tokenId
     */
    static mockedTokenMap = (tokenId: string): string =>{
        return "f6a69529b12a7e2326acffee8383e0c44408f87a872886fadf410fe8498006d3"
    }

    /**
     * returns true if the box format is like rosen bridge observations
     * @param box
     */
    static isRosenData = (box: NodeOutputBox) : boolean => {
        const r4 = decodeCollColl(box.additionalRegisters['R4'])
        return r4.length >= 4 && this.mockedTokenMap(box.assets[0].tokenId) != undefined
    }

    /**
     * Returns the observation of exists in transaction outputs
     * Assumes there is at most one observation in each transaction
     * @param blockHash
     * @param tx
     * @param lockAddress
     */
    static checkTx = async (blockHash: string, tx: NodeTransaction, lockAddress: string): Promise<Observation | undefined> => {
        try {
            const lockErgoTree = Address.from_base58(lockAddress).to_ergo_tree().to_base16_bytes()
            const observation: NodeOutputBox = tx.outputs.filter((box) =>
                lockErgoTree == box.ergoTree
            ).filter(box => box.assets.length > 0 && ErgoScanner.isRosenData(box))[0]
            if (observation != undefined) {
                const r4 = decodeCollColl(observation.additionalRegisters['R4'])
                const token = observation.assets[0]
                const inputAddress = "fromAddress"
                const requestId = Buffer.from(blake2b(Buffer.from(observation.transactionId, "hex"), undefined, 32)).toString("hex")
                // TODO: Fix the input address
                //ergoTreeToAddress((await ErgoNetwork.boxById(tx.inputs[0].boxId)).ergo_tree()).to_base58(ergoConfig.networkType)
                return {
                    fromChain: ergoScannerConfig.nameConstant,
                    toChain: Buffer.from(r4[0]).toString(),
                    networkFee: Buffer.from(r4[2]).toString(),
                    bridgeFee: Buffer.from(r4[3]).toString(),
                    amount: token.amount.toString(),
                    sourceChainTokenId: token.tokenId,
                    targetChainTokenId: this.mockedTokenMap(token.tokenId),
                    sourceTxId: observation.transactionId,
                    sourceBlockId: blockHash,
                    requestId: requestId,
                    toAddress: Buffer.from(r4[1]).toString(),
                    fromAddress: inputAddress,
                }
            }
        } catch (e){
            console.log("Something went wrong during transaction checking")
            console.log(e)
        }
        return undefined
    }

    /**
     * getting block and extracting observations from the network
     * @param block
     * @return Promise<Array<Observation | undefined>>
     */
    getBlockInformation = async (block: Block): Promise<Array<Observation>> => {
        const observations: Array<Observation> = []
        const txs = await this._networkAccess.getBlockTxs(block.hash)
        for(const tx of txs) {
            const observation = await ErgoScanner.checkTx(block.hash, tx, rosenConfig.lockAddress)
            if(observation != undefined) {
                console.log("Found observation:")
                console.log(observation)
                observations.push(observation)
            }
        }
        return observations
    }

}

