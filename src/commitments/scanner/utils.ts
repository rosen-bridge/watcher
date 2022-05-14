import {commitmentAddress} from "../../../config/default";
import {Commitment} from "../../objects/interfaces";
import {tokens} from "../../../config/default";
import * as wasm from "ergo-lib-wasm-nodejs";
import {ErgoNetworkApi} from "../network/networkApi";
import {decodeCollColl, decodeStr, ergoTreeToBase58Address} from "../../utils/utils";
import {ExplorerOutputBox, ExplorerTransaction, NodeOutputBox, NodeTransaction} from "../network/ergoApiModels";

export class CommitmentUtils {

    /**
     * check if a transaction generates a commitment or not if yes returns the commitment
     * object else returns undefined
     * @param tx
     * @param commitmentAddresses
     * @param networkAccess
     * @return Promise<commitment|undefined>
     */
    static checkTx = async (tx: NodeTransaction,
                            commitmentAddresses: Array<string>,
                            networkAccess: ErgoNetworkApi):
        Promise<Commitment | undefined> => {
        const commitment: NodeOutputBox = tx.outputs.filter((box) => {
            return commitmentAddresses.find(address =>
                address === ergoTreeToBase58Address(wasm.ErgoTree.from_base16_bytes(box.ergoTree)))
                != undefined;
        }).filter(box => box.assets.length > 0 && box.assets[0].tokenId == tokens.RWT)[0]
        if(commitment != undefined){
            const WID = (await decodeCollColl(commitment.additionalRegisters['R4']))[0]
            const requestId = (await decodeCollColl(commitment.additionalRegisters['R5']))[0]
            const eventDigest = await decodeStr(commitment.additionalRegisters['R6'])
            return{
                WID: Buffer.from(WID).toString('hex'),
                eventId: Buffer.from(requestId).toString('hex'),
                commitment: eventDigest,
                commitmentBoxId: commitment.boxId
            }
        }
        return undefined;
    }

    /**
     * check all the transaction in a block and returns an array of commitments
     * @param blockHash
     * @param networkAccess
     * @return Promise<Array<(Commitment | undefined)>>
     */
    static commitmentsAtHeight = async (
        blockHash: string,
        networkAccess: ErgoNetworkApi
    ): Promise<Array<(Commitment | undefined)>> => {
        const txs = await networkAccess.getBlockTxs(blockHash);
        const commitment = Array(txs.length).fill(undefined);
        for (let i = 0; i < txs.length; i++) {
            commitment[i] = await this.checkTx(txs[i], [commitmentAddress], networkAccess);
        }
        return commitment;
    }
}

