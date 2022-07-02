import { ErgoNetworkApi } from "../bridge/network/networkApi";
import { Observation } from "../objects/interfaces";
import { NodeOutputBox, NodeTransaction } from "../bridge/network/ergoApiModels";
import { rosenConfig } from "../config/rosenConfig";
import { Address } from "ergo-lib-wasm-nodejs";
import { decodeCollColl, ergoTreeToAddress } from "../ergo/utils";
import { ErgoNetwork } from "../ergo/network/ergoNetwork";
import { ErgoConfig } from "../config/config";
import { Buffer } from "buffer";
import { TextDecoder } from "util";

const ergoConfig = ErgoConfig.getConfig();

export class ErgoUtils {

    static mockedTokenMap = (tokenId: string): string =>{
        return "targetTokenId"
    }

    /**
     * returns true if the box format is like rosen bridge observations
     * @param box
     */
    static isRosenData = (box: NodeOutputBox) : Boolean => {
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
        const lockErgoTree = Address.from_base58(lockAddress).to_ergo_tree().to_base16_bytes()
        const observation: NodeOutputBox = tx.outputs.filter((box) =>
            lockErgoTree == box.ergoTree
        ).filter(box => box.assets.length > 0 && ErgoUtils.isRosenData(box))[0]
        if(observation != undefined) {
            const r4 = decodeCollColl(observation.additionalRegisters['R4'])
            const token = observation.assets[0]
            const inputAddress = ergoTreeToAddress((await ErgoNetwork.boxById(tx.inputs[0].boxId)).ergo_tree()).to_base58(ergoConfig.networkType)
            return {
                fromChain: "Ergo",
                toChain: Buffer.from(r4[0]).toString(),
                networkFee: Buffer.from(r4[2]).toString(),
                bridgeFee: Buffer.from(r4[3]).toString(),
                amount: token.amount.toString(),
                sourceChainTokenId: token.tokenId,
                targetChainTokenId: this.mockedTokenMap(token.tokenId),
                sourceTxId: observation.transactionId,
                sourceBlockId: blockHash,
                requestId: observation.transactionId,
                toAddress: Buffer.from(r4[1]).toString(),
                fromAddress: inputAddress,
            }
        }
        return undefined
    }

    /**
     * Returns all observations in a block
     * @param blockHash
     * @param networkApi
     */
    static observationsAtHeight = async (blockHash: string, networkApi: ErgoNetworkApi): Promise<Array<Observation>> => {
        let observations: Array<Observation> = []
        const txs = await networkApi.getBlockTxs(blockHash)
        for(const tx of txs) {
            const observation = await this.checkTx(blockHash, tx, rosenConfig.lockAddress)
            if(observation != undefined) observations.push(observation)
        }
        return observations
    }
}