import * as wasm from "ergo-lib-wasm-nodejs";
import { contracts } from "../contracts/contracts";
import { ErgoNetworkApi } from "../ergoUtils/networkApi";
import config from "config";
import { boxes } from "../ergoUtils/boxes";
import { commitmentFromObservation, contractHash, createAndSignTx } from "../ergoUtils/ergoUtils";
import { NetworkDataBase } from "../models/networkModel";
import { boxCreationError } from "../utils/utils";
import { cardanoOrmConfig } from "../../config/ormconfig";
import { Commitment, Observation } from "../objects/interfaces";

const minBoxVal = parseInt(config.get?.('ergo.minBoxVal'))
const txFee = parseInt(config.get?.('ergo.txFee'))
const WID: string = config.get('ergo.WID')

export class commitmentCreation {
    _dataBase: NetworkDataBase
    _requiredConfirmation: number

    constructor(db: NetworkDataBase, confirmation: number) {
        this._dataBase = db
        this._requiredConfirmation = confirmation
    }

    /**
     * creates the commitment transaction and sends it to the network
     * @param WID
     * @param requestId
     * @param eventDigest
     * @param permits
     * @param WIDBox
     */
    createCommitmentTx = async (WID: string,
                                requestId: string,
                                eventDigest: Uint8Array,
                                permits: Array<wasm.ErgoBox>,
                                WIDBox: wasm.ErgoBox): Promise<string> => {
        const height = await ErgoNetworkApi.getCurrentHeight()
        const permitHash = contractHash(contracts.addressCache.permitContract!)
        const outCommitment = boxes.createCommitment(BigInt(minBoxVal), height, WID, requestId, eventDigest, permitHash)
        const RWTCount: number = permits.map(permit =>
            permit.tokens().get(0).amount().as_i64().as_num())
            .reduce((a, b) => a + b, 0)
        const outPermit = boxes.createPermit(BigInt(minBoxVal), height, RWTCount - 1, WID)
        // const rewardValue = permits.map(permit => BigInt(permit.value().as_i64().to_str())).reduce((a, b) => a + b, BigInt(0))
        // TODO: Complete Watcher Payment (Token rewards)
        // Don't forget to consider WIDBox assets
        // const paymentTokens: Array<wasm.Token> = permits.map(permit => extractTokens(permit.tokens())).
        // const paymentValue = BigInt(WIDBox.value().as_i64().to_str()) + rewardValue - BigInt(txFee + 2 * minBoxVal)
        // const watcherPayment = boxes.createPayment(BigInt(paymentValue), height, [])
        const inputBoxes = new wasm.ErgoBoxes(WIDBox);
        permits.forEach(permit => inputBoxes.add(permit))
        try {
            const signed = await createAndSignTx(
                config.get("ergo.secret"),
                inputBoxes,
                [outPermit, outCommitment],
                height
            )
            await ErgoNetworkApi.sendTx(signed.to_json())
            return signed.id().to_str()
        } catch (e) {
            if (e instanceof boxCreationError) {
                console.log("Transaction input and output doesn't match. Input boxes assets must be more or equal to the outputs assets.")
            }
            console.log("Skipping the commitment creation.")
            return ""
        }
    }

    /**
     * Extracts the confirmed observations and creates the commitment transaction
     * Finally saves the created commitment in the database
     */
    job = async () => {
        const observations = await this._dataBase.getConfirmedObservations(this._requiredConfirmation)
        for (const observation of observations) {
            const commitment = commitmentFromObservation(observation, WID)
            const permits = await boxes.getPermits(WID)
            const WIDBox = await boxes.getWIDBox(WID)
            const txId = await this.createCommitmentTx(WID, observation.requestId, commitment, permits, WIDBox[0])
            await this._dataBase.saveCommitment({
                eventId: observation.requestId,
                commitment: commitment.toString(),
                commitmentBoxId: "",
                WID: WID
            }, txId, observation.id)
        }
    }
}

const firstObservations: Array<Observation> = [{
    fromChain: "erg",
    toChain: "cardano",
    fromAddress: "ErgoAddress",
    toAddress: "cardanoAddress",
    amount: "1000000000",
    fee: "1000000",
    sourceChainTokenId: "ergoTokenId",
    targetChainTokenId: "cardanoTokenId",
    sourceTxId: "ergoTxId1",
    sourceBlockId: "ergoBlockId",
    requestId: "reqId1",
}];

const secondObservations: Array<Observation> = [{
    fromChain: "erg",
    toChain: "cardano",
    fromAddress: "ergoAddress",
    toAddress: "cardanoAddress",
    amount: "1100000000",
    fee: "1100000",
    sourceChainTokenId: "ergoTokenId",
    targetChainTokenId: "cardanoTokenId",
    sourceTxId: "ergoTxId2",
    sourceBlockId: "ergoBlockId",
    requestId: "reqId2",
}];

export const commitmentCreationMain = async() => {
    const DB = await NetworkDataBase.init(cardanoOrmConfig);
    await DB.saveBlock(
        3433333,
        "26197be6579e09c7edec903239866fbe7ff6aee2e4ed4031c64d242e9dd1bff6",
        firstObservations
    );
    await DB.saveBlock(
        3433334,
        "19b60182cba99d621b3d02457fefb4cda81f4fbde3ca719617cbed2e4cc5c0ce",
        secondObservations
    );
    const cc = new commitmentCreation(DB, 0)
    await cc.job()
}
