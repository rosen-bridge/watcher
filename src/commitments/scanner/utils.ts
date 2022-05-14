import {commitmentAddress} from "../../../config/default";
import {Commitment} from "../../objects/interfaces";
import {tokens} from "../../../config/default";
import * as wasm from "ergo-lib-wasm-nodejs";
import {ErgoNetworkApi} from "../network/networkApi";
import {decodeCollColl, decodeStr, ergoTreeToBase58Address} from "../../utils/utils";
import {ExplorerOutputBox, ExplorerTransaction, NodeOutputBox, NodeTransaction} from "../network/ergoApiModels";
import {CommitmentDataBase} from "../../models/commitmentModel";

export class CommitmentUtils {

    /**
     * check if a transaction generates a commitment or not if yes returns the commitment
     * object else returns undefined
     * @param tx
     * @param commitmentAddresses
     * @return Promise<commitment|undefined>
     */
    static checkTx = async (tx: NodeTransaction,
                            commitmentAddresses: Array<string>):
        Promise<Commitment | undefined> => {
        const commitment: NodeOutputBox = tx.outputs.filter((box) =>
            commitmentAddresses.includes(ergoTreeToBase58Address(wasm.ErgoTree.from_base16_bytes(box.ergoTree)))
        ).filter(box => box.assets.length > 0 && box.assets[0].tokenId == tokens.RWT)[0]
        if(commitment != undefined){
            const WID = (await decodeCollColl(commitment.additionalRegisters['R4']))[0]
            const requestId = (await decodeCollColl(commitment.additionalRegisters['R5']))[0]
            const eventDigest = await decodeStr(commitment.additionalRegisters['R6'])
            return{
                WID: Buffer.from(WID).toString('hex'),
                eventId: Buffer.from(requestId).toString('hex'),
                commitment: eventDigest,
                commitmentBoxId: commitment.boxId,
            }
        }
        return undefined;
    }

    /**
     * Check all the transaction in a block and returns an array of commitments
     * It also updates the spent commitments in the database
     * @param txs
     * @param database
     * @param blockHeight
     * @return Promise<Array<(Commitment | undefined)>>
     */
    static commitmentsAtHeight = async (
        txs: NodeTransaction[],
        database: CommitmentDataBase,
        blockHeight: number
        ): Promise<Array<(Commitment | undefined)>> => {
        const commitment = Array(txs.length).fill(undefined);
        for (let i = 0; i < txs.length; i++) {
            commitment[i] = await this.checkTx(txs[i], [commitmentAddress]);
        }
        for( const tx of txs){
            const inputBoxIds: string[] = tx.inputs.map(box => box.boxId)
            const foundCommitments = await database.findCommitmentsById(inputBoxIds)
            // TODO: Add Created eventTrigger BoxId
            foundCommitments.forEach(commitment => database.updateSpentCommitment(commitment.id, blockHeight))
        }
        txs.forEach(tx => {

        })
        return commitment;
    }
}

