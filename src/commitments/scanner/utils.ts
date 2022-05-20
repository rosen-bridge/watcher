import {commitmentAddress} from "../../../config/default";
import {Commitment} from "../../objects/interfaces";
import {tokens} from "../../../config/default";
import {decodeCollColl, decodeStr} from "../../utils/utils";
import {NodeOutputBox, NodeTransaction} from "../network/ergoApiModels";
import {CommitmentDataBase} from "../models/commitmentModel";
import {Address} from "ergo-lib-wasm-nodejs";

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
        const commitmentErgoTrees: Array<string> = commitmentAddresses.map(ad => Address.from_base58(ad).to_ergo_tree().to_base16_bytes())
        const commitment: NodeOutputBox = tx.outputs.filter((box) =>
            commitmentErgoTrees.includes(box.ergoTree)
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
     * @return Promise<Array<(Commitment | undefined)>>
     */
    static commitmentsAtHeight = async (txs: NodeTransaction[]): Promise<Array<Commitment>> => {
        const commitments: Array<Commitment> = []
        for (let i = 0; i < txs.length; i++) {
            const c = await this.checkTx(txs[i], [commitmentAddress])
            if(c!== undefined) commitments.push(c);
        }
        return commitments;
    }

    /**
     * Returns spent commitments on the block to update the database information
     * @param txs
     * @param database
     * @param newCommitments
     * @return list of updated commitment box ids
     */
    static updatedCommitmentsAtHeight = async (txs: Array<NodeTransaction>,
                                               database: CommitmentDataBase,
                                               newCommitments: Array<string>) => {
        let updatedCommitments: Array<string> = []
        for(const tx of txs) {
            const inputBoxIds: string[] = tx.inputs.map(box => box.boxId)
            const foundCommitments = (await database.findCommitmentsById(inputBoxIds)).map(commitment => commitment.commitmentBoxId)
            const newUpdatedCommitments = inputBoxIds.filter(boxId => newCommitments.includes(boxId))
            updatedCommitments = updatedCommitments.concat(foundCommitments)
            updatedCommitments = updatedCommitments.concat(newUpdatedCommitments)
        }
        return updatedCommitments
    }
}

