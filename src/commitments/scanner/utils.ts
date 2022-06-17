import { Commitment, SpecialBox } from "../../objects/interfaces";
import { decodeCollColl, decodeStr } from "../../utils/utils";
import { NodeOutputBox, NodeTransaction } from "../network/ergoApiModels";
import { CommitmentDataBase } from "../models/commitmentModel";
import { Address } from "ergo-lib-wasm-nodejs";
import { rosenConfig } from "../../config/rosenConfig";
import { ErgoConfig } from "../../config/config";
import { boxType } from "../../entities/BoxEntity";

const ergoConfig = ErgoConfig.getConfig();

export class CommitmentUtils{

    /**
     * check if a transaction generates a commitment or not if yes returns the commitment
     * object else returns undefined
     * @param tx
     * @param commitmentAddresses
     * @return Promise<commitment>
     */
    static checkTx = async (tx: NodeTransaction,
                            commitmentAddresses: Array<string>):
        Promise<Commitment | undefined> => {
        const commitmentErgoTrees: Array<string> = commitmentAddresses.map(ad => Address.from_base58(ad).to_ergo_tree().to_base16_bytes())
        const commitment: NodeOutputBox = tx.outputs.filter((box) =>
            commitmentErgoTrees.includes(box.ergoTree)
        ).filter(box => box.assets.length > 0 && box.assets[0].tokenId == ergoConfig.RWTId)[0]
        if (commitment != undefined) {
            const WID = (await decodeCollColl(commitment.additionalRegisters['R4']))[0]
            const requestId = (await decodeCollColl(commitment.additionalRegisters['R5']))[0]
            const eventDigest = await decodeStr(commitment.additionalRegisters['R6'])
            return {
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
            const c = await this.checkTx(txs[i], [rosenConfig.commitmentAddress])
            if (c !== undefined) commitments.push(c);
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
        for (const tx of txs) {
            const inputBoxIds: string[] = tx.inputs.map(box => box.boxId)
            const foundCommitments = (await database.findCommitmentsById(inputBoxIds)).map(commitment => commitment.commitmentBoxId)
            const newUpdatedCommitments = inputBoxIds.filter(boxId => newCommitments.includes(boxId))
            updatedCommitments = updatedCommitments.concat(foundCommitments)
            updatedCommitments = updatedCommitments.concat(newUpdatedCommitments)
        }
        return updatedCommitments
    }

    static specialBoxesAtHeight = async (txs: Array<NodeTransaction>,
                                         permitAddress: string,
                                         watcherAddress: string,
                                         WID: string): Promise<Array<SpecialBox>> => {
        const specialBoxes: Array<SpecialBox> = []
        const permitErgoTree = Address.from_base58(permitAddress).to_ergo_tree().to_base16_bytes()
        const watcherErgoTree = Address.from_base58(watcherAddress).to_ergo_tree().to_base16_bytes()
        for (const tx of txs) {
            // Adding new permit boxes
            tx.outputs.filter(box => {
                return box.ergoTree === permitErgoTree &&
                    box.assets.length > 0 &&
                    box.assets[0].tokenId == ergoConfig.RWTId
            }).forEach(permit => specialBoxes.push({
                boxId: permit.boxId,
                type: boxType.PERMIT,
                value: permit.value.toString(),
                boxJson: JSON.stringify(permit)
            }))
            // Adding new WID boxes
            const watcherBoxes = tx.outputs.filter(box => {return box.ergoTree === watcherErgoTree})
            const WIDBOxes = watcherBoxes.filter(box => {
                return box.ergoTree === watcherErgoTree &&
                    box.assets.length > 0 &&
                    box.assets[0].tokenId == WID
            })
            WIDBOxes.forEach(WIDBox => specialBoxes.push({
                boxId: WIDBox.boxId,
                type: boxType.WID,
                value: WIDBox.value.toString(),
                boxJson: JSON.stringify(WIDBox)
            }))
            // Adding other owned boxes
            watcherBoxes.filter(box => !WIDBOxes.includes(box))
                .forEach(box => specialBoxes.push({
                    boxId: box.boxId,
                    type: boxType.PLAIN,
                    value: box.value.toString(),
                    boxJson: JSON.stringify(box)
                }))
        }
        return specialBoxes;
    }

    static spentSpecialBoxesAtHeight = async (txs: Array<NodeTransaction>,
                                               database: CommitmentDataBase,
                                               newBoxes: Array<string>) => {
        let spentBoxes: Array<string> = []
        for (const tx of txs) {
            const inputBoxIds: string[] = tx.inputs.map(box => box.boxId)
            const foundBoxes = (await database.findSpecialBoxesById(inputBoxIds)).map(box => box.boxId)
            const newUpdatedBoxes = inputBoxIds.filter(boxId => newBoxes.includes(boxId))
            spentBoxes = spentBoxes.concat(foundBoxes)
            spentBoxes = spentBoxes.concat(newUpdatedBoxes)
        }
        return spentBoxes
    }
}

