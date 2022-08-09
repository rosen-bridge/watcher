import { MetaData, RosenData, Utxo } from "../network/apiModelsCardano";
import { BANK } from "./bankAddress";
import { Observation } from "../../objects/interfaces";
import { KoiosNetwork } from "../network/koios";
import { blake2b } from "blakejs";
import { Buffer } from "buffer";
import { CardanoConfig } from "../../config/config";
import { RosenTokens, TokenMap } from "@rosen-bridge/tokens";

export const cardanoConfig = CardanoConfig.getConfig()

export class CardanoUtils{
    tokenMap: TokenMap;

    constructor(tokensMap: RosenTokens) {
        this.tokenMap = new TokenMap(tokensMap);
    }

    /**
     * check if the object is the rosen bridge data type or not
     * @param data
     * @return boolean
     */
    isRosenData(data: object): data is RosenData {
        return 'to' in data &&
            'bridgeFee' in data &&
            'networkFee' in data &&
            'targetChainTokenId' in data &&
            'toAddress' in data;
    }

    /**
     * check if the metadata of cardano transaction have `0` key or not
     * @param metaData
     * @return boolean
     */
    isRosenMetaData(metaData: object): metaData is MetaData {
        return "0" in metaData;
    }

    /**
     * check if a transaction is an observation or not if yes returns an observation
     * object else returns undefined
     * @param txHash
     * @param blockHash
     * @param bank
     * @param networkAccess
     * @return Promise<observation|undefined>
     */
    checkTx = async (txHash: string, blockHash: string, bank: Array<string>, networkAccess: KoiosNetwork): Promise<Observation | undefined> => {
        const tx = (await networkAccess.getTxUtxos([txHash]))[0];
        const utxos = tx.utxosOutput.filter((utxo: Utxo) => {
            return bank.find(address => address === utxo.payment_addr.bech32) != undefined;
        });
        if (utxos.length !== 0) {
            const txMetaData = (await networkAccess.getTxMetaData([txHash]))[0];
            const metaData = txMetaData.metadata;
            if (this.isRosenMetaData(metaData) && this.isRosenData(metaData["0"])) {
                if (utxos[0].asset_list.length !== 0) {
                    const asset = utxos[0].asset_list[0];
                    const token = this.tokenMap.search(
                        'cardano',
                        {
                            policyID: asset.policy_id,
                            assetID: asset.asset_name
                        });
                    if (token.length === 0) {
                        return undefined;
                    }
                    const tokenId = this.tokenMap.getID(token[0], 'cardano');
                    const data = metaData["0"];
                    const requestId = Buffer.from(blake2b(txHash, undefined, 32)).toString("hex")
                    return {
                        fromChain: cardanoConfig.nameConstant,
                        toChain: data.to,
                        amount: asset.quantity,
                        sourceChainTokenId: tokenId,
                        targetChainTokenId: data.targetChainTokenId,
                        sourceTxId: txHash,
                        bridgeFee: data.bridgeFee,
                        networkFee: data.networkFee,
                        sourceBlockId: blockHash,
                        requestId: requestId,
                        toAddress: data.toAddress,
                        fromAddress: tx.utxosInput[0].payment_addr.bech32
                    }
                }
            }
            return undefined;
        }
    }

    /**
     * check all the transaction in a block and returns an array of observations and undefineds
     * @param blockHash
     * @param networkAccess
     * @return Promise<Array<(Observation | undefined)>>
     */
    observationsAtHeight = async (blockHash: string,
                                  networkAccess: KoiosNetwork): Promise<Array<Observation>> => {
        const txs = await networkAccess.getBlockTxs(blockHash);
        const observations: Array<Observation> = []
        for (let i = 0; i < txs.length; i++) {
            const o = await this.checkTx(txs[i], blockHash, BANK, networkAccess)
            if (o != undefined) observations.push(o)
        }
        return observations;
    }
}

