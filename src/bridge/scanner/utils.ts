import { Commitment, SpecialBox, SpentBox } from "../../objects/interfaces";
import { decodeCollColl, decodeStr } from "../../utils/utils";
import { NodeOutputBox, NodeTransaction } from "../network/ergoApiModels";
import { BridgeDataBase } from "../models/bridgeModel";
import { Address } from "ergo-lib-wasm-nodejs";
import { rosenConfig } from "../../config/rosenConfig";
import { ErgoConfig } from "../../config/config";
import { SpendReason } from "../../entities/watcher/bridge/ObservedCommitmentEntity";
import { BoxType } from "../../entities/watcher/bridge/BoxEntity";

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
     * Check all the transaction in a block and returns an array of bridge
     * It also updates the spent bridge in the database
     * @param txs
     * @return Promise<Array<(Commitment | undefined)>>
     */
    static extractCommitments = async (txs: NodeTransaction[]): Promise<Array<Commitment>> => {
        const commitments: Array<Commitment> = []
        for (let i = 0; i < txs.length; i++) {
            const c = await this.checkTx(txs[i], [rosenConfig.commitmentAddress])
            if (c !== undefined) commitments.push(c);
        }
        return commitments;
    }

    /**
     * Returns spent bridge on the block to update the database information
     * @param txs
     * @param database
     * @param newCommitments
     * @return list of updated commitment box ids
     */
    static updatedCommitments = async (txs: Array<NodeTransaction>,
                                       database: BridgeDataBase,
                                       newCommitments: Array<string>) => {
        const eventTriggerErgoTree = Address.from_base58(rosenConfig.eventTriggerAddress).to_ergo_tree().to_base16_bytes()
        let updatedCommitments: Array<SpentBox> = []
        for (const tx of txs) {
            const inputBoxIds: string[] = tx.inputs.map(box => box.boxId)
            const foundCommitments = (await database.findCommitmentsById(inputBoxIds)).map(commitment => commitment.commitmentBoxId)
            const newUpdatedCommitments = inputBoxIds.filter(boxId => newCommitments.includes(boxId))
            let reason: SpendReason = SpendReason.REDEEM
            if(tx.outputs[0].ergoTree.toString() === eventTriggerErgoTree) reason = SpendReason.MERGE
            foundCommitments.forEach(box => updatedCommitments.push({boxId: box, spendReason: reason}))
            newUpdatedCommitments.forEach(box => updatedCommitments.push({boxId: box, spendReason: reason}))
        }
        return updatedCommitments
    }

    /**
     * Extracts new special boxesSample created in an array of transaction from a block
     * @param txs
     * @param permitAddress
     * @param watcherAddress
     * @param WID
     */
    static extractSpecialBoxes = async (txs: Array<NodeTransaction>,
                                        permitAddress: string,
                                        watcherAddress: string,
                                        WID: string): Promise<Array<SpecialBox>> => {
        const specialBoxes: Array<SpecialBox> = []
        const permitErgoTree = Address.from_base58(permitAddress).to_ergo_tree().to_base16_bytes()
        const watcherErgoTree = Address.from_base58(watcherAddress).to_ergo_tree().to_base16_bytes()
        for (const tx of txs) {
            tx.outputs.forEach(box => {
                // Adding new permit boxesSample
                if(box.ergoTree === permitErgoTree &&
                    box.assets.length > 0 &&
                    box.assets[0].tokenId == ergoConfig.RWTId) {
                    specialBoxes.push({
                        boxId: box.boxId,
                        type: BoxType.PERMIT,
                        value: box.value.toString(),
                        boxJson: JSON.stringify(box)
                    })
                }
                if (box.ergoTree === watcherErgoTree) {
                    // Adding new WID boxesSample
                    if (box.assets.length > 0 && box.assets[0].tokenId == WID) {
                        specialBoxes.push({
                            boxId: box.boxId,
                            type: BoxType.WID,
                            value: box.value.toString(),
                            boxJson: JSON.stringify(box)
                        })
                    } else {
                        // Adding new plain boxesSample
                        specialBoxes.push({
                            boxId: box.boxId,
                            type: BoxType.PLAIN,
                            value: box.value.toString(),
                            boxJson: JSON.stringify(box)
                        })
                    }
                }
            })
        }
        return specialBoxes;
    }

    /**
     * Extract spent special boxesSample from the block transactions
     * @param txs
     * @param database
     * @param newBoxes
     */
    static spentSpecialBoxes = async (txs: Array<NodeTransaction>,
                                      database: BridgeDataBase,
                                      newBoxes: Array<string>) => {
        let spentBoxes: Array<string> = []
        for (const tx of txs) {
            const inputBoxIds: string[] = tx.inputs.map(box => box.boxId)
            const foundBoxes = (await database.findUnspentSpecialBoxesById(inputBoxIds)).map(box => box.boxId)
            const newUpdatedBoxes = inputBoxIds.filter(boxId => newBoxes.includes(boxId))
            spentBoxes = spentBoxes.concat(foundBoxes)
            spentBoxes = spentBoxes.concat(newUpdatedBoxes)
        }
        return spentBoxes
    }
}

