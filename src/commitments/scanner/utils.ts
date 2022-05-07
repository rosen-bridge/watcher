import {commitmentAddress} from "../../../config/default";
import {Commitment} from "../../objects/interfaces";
import {tokens} from "../../../config/default";
import * as wasm from "ergo-lib-wasm-nodejs";
import {ErgoNetworkApi} from "../network/networkApi";
import {extractBoxes, ergoTreeToBase58Address} from "../../utils/utils";

export class CommitmentUtils {

    /**
     * check if a transaction generates a commitment or not if yes returns the commitment
     * object else returns undefined
     * @param txHash
     * @param blockHash
     * @param commitmentAddresses
     * @param networkAccess
     * @return Promise<commitment|undefined>
     */
    static checkTx = async (txHash: string,
                            blockHash: string,
                            commitmentAddresses: Array<string>,
                            networkAccess: ErgoNetworkApi):
        Promise<Commitment | undefined> => {
        const tx = (await networkAccess.getTxMetaData([txHash]))[0];
        const commitment: wasm.ErgoBox = extractBoxes(tx).filter((box) => {
            return commitmentAddresses.find(address => address === ergoTreeToBase58Address(box.ergo_tree())) != undefined;
        }).filter(box => box.tokens().len() > 0 && box.tokens().get(0).id().to_str() == tokens.RWT)[0]
        if(commitment != undefined){
            const WID = commitment.register_value(0)?.to_coll_coll_byte()[0]!
            const requestId = commitment.register_value(1)?.to_coll_coll_byte()[0]!
            const eventDigest = commitment.register_value(2)?.to_byte_array()!
            return{
                WID: Buffer.from(WID).toString('hex'),
                eventId: Buffer.from(requestId).toString('hex'),
                commitment: Buffer.from(eventDigest).toString('hex'),
                commitmentBoxId: commitment.box_id().to_str()
            }
        }
        return undefined;
    }

    /**
     * check all the transaction in a block and returns an array of commitments
     * @param blockHash
     * @param networkAccess
     * @return Promise<Array<(Observation | undefined)>>
     */
    static commitmentsAtHeight = async (
        blockHash: string,
        networkAccess: ErgoNetworkApi
    ): Promise<Array<(Commitment | undefined)>> => {
        const txs = await networkAccess.getBlockTxs(blockHash);
        const observation = Array(txs.length).fill(undefined);
        for (let i = 0; i < txs.length; i++) {
            observation[i] = await this.checkTx(txs[i], blockHash, [commitmentAddress], networkAccess);
        }
        return observation;
    }
}

