import { MetaData, RosenData, Tx, TxMetaData, Utxo } from "../network/apiModelsCardano";
import AssetFingerprint from "@emurgo/cip14-js";
import { BANK } from "./bankAddress";
import { NetworkAbstract } from "../../network/network-abstract";

export interface Observation {
    fromChain: string
    toChain: string
    toAddress: string
    amount: string
    fee: string
    sourceChainTokenId: string
    targetChainTokenId: string
    sourceTxId: string
    sourceBlockId: string
    requestId: string

}

export class CardanoUtils {

    /**
     * check if the object is the rosen bridge data type or not
     * @param data
     * @return boolean
     */
    static isRosenData(data: object): data is RosenData {
        return 'to' in data &&
            'from' in data &&
            'fee' in data &&
            'targetChainTokenId' in data &&
            'toAddress' in data;
    }

    /**
     * check if the metadata of cardano transaction have `0` key or not
     * @param metaData
     * @return boolean
     */
    static isRosenMetaData(metaData: object): metaData is MetaData {
        return "0" in metaData;
    }

    /**
     * check if a transaction is an observation or not if yes returns an observation
     * object else returns undefined
     * @param txHash
     * @param blockHash
     * @param bank
     * @return Promise<observation|undefined>
     */
    static checkTx = async (txHash: string, blockHash: string, bank: Array<string>, networkAccess: NetworkAbstract<Tx, TxMetaData>): Promise<Observation | undefined> => {
        const tx = (await networkAccess.getTxUtxos([txHash]))[0];
        const utxos = tx.utxos.filter((utxo: Utxo) => {
            return bank.find(address => address === utxo.payment_addr.bech32) != undefined;
        });
        if (utxos.length !== 0) {
            const txMetaData = (await networkAccess.getTxMetaData([txHash]))[0];
            const metaData = txMetaData.metadata;
            if (this.isRosenMetaData(metaData) && this.isRosenData(metaData["0"])) {
                if (utxos[0].asset_list.length !== 0) {
                    const asset = utxos[0].asset_list[0];
                    const assetFingerprint = AssetFingerprint.fromParts(
                        Buffer.from(asset.policy_id, 'hex'),
                        Buffer.from(asset.asset_name, 'hex'),
                    );
                    const data = metaData["0"];
                    return {
                        fromChain: data.from,
                        toChain: data.to,
                        fee: data.fee,
                        amount: asset.quantity,
                        sourceChainTokenId: assetFingerprint.fingerprint(),
                        targetChainTokenId: data.targetChainTokenId,
                        sourceTxId: txHash,
                        sourceBlockId: blockHash,
                        requestId: txHash,
                        toAddress: data.toAddress,
                    }
                }
            }
            return undefined;
        }
    }

    /**
     * check all the transaction in a block and returns an array of observations and undefineds
     * @param blockHash
     * @return Promise<Array<(Observation | undefined)>>
     */
    static observationsAtHeight = async (blockHash: string, networkAccess: NetworkAbstract<Tx, TxMetaData>): Promise<Array<(Observation | undefined)>> => {
        const txs = await networkAccess.getBlockTxs(blockHash);
        const observation = Array(txs.length).fill(undefined);
        for (let i = 0; i < txs.length; i++) {
            observation[i] = await this.checkTx(txs[i], blockHash, BANK, networkAccess);
        }
        return observation;
    }
}

