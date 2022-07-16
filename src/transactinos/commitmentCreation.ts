import * as wasm from "ergo-lib-wasm-nodejs";
import { Boxes } from "../ergo/boxes";
import { ErgoUtils, hexStrToUint8Array } from "../ergo/utils";
import { rosenConfig } from "../config/rosenConfig";
import { ErgoConfig } from "../config/config";
import { ErgoNetwork } from "../ergo/network/ergoNetwork";
import { boxCreationError, NotEnoughFund } from "../errors/errors";
import { DatabaseConnection } from "../ergo/databaseConnection";
import { Transaction } from "../api/Transaction";

const ergoConfig = ErgoConfig.getConfig();

export class CommitmentCreation {
    _dataBaseConnection: DatabaseConnection
    _boxes: Boxes
    _widApi: Transaction

    constructor(db: DatabaseConnection, boxes: Boxes, api: Transaction) {
        this._dataBaseConnection = db
        this._boxes = boxes
        this._widApi = api
    }

    /**
     * creates the commitment transaction and sends it to the network
     * @param WID
     * @param requestId
     * @param eventDigest
     * @param permits
     * @param WIDBox
     * @param feeBoxes
     */
    createCommitmentTx = async (WID: string,
                                requestId: string,
                                eventDigest: Uint8Array,
                                permits: Array<wasm.ErgoBox>,
                                WIDBox: wasm.ErgoBox,
                                feeBoxes: Array<wasm.ErgoBox>): Promise<{txId?: string, commitmentBoxId?: string}> => {
        const height = await ErgoNetwork.getHeight()
        const permitHash = ErgoUtils.contractHash(
            wasm.Contract.pay_to_address(
                wasm.Address.from_base58(
                    rosenConfig.watcherPermitAddress
                )
            )
        )
        const outCommitment = this._boxes.createCommitment(height, WID, requestId, eventDigest, permitHash)
        const RWTCount: bigint = permits.map(permit =>
            BigInt(permit.tokens().get(0).amount().as_i64().to_str()))
            .reduce((a, b) => a + b, BigInt(0))
        if (RWTCount <= 1) {
            // TODO: Fix this problem
            console.log("Not enough RWT tokens to create a new commitment")
            return {}
        }
        const outPermit = this._boxes.createPermit(height, RWTCount - BigInt(1), hexStrToUint8Array(WID))
        const inputBoxes = new wasm.ErgoBoxes(permits[0]);
        inputBoxes.add(WIDBox)
        permits.slice(1).forEach(permit => inputBoxes.add(permit))
        feeBoxes.forEach(box => inputBoxes.add(box))
        try {
            const signed = await ErgoUtils.createAndSignTx(
                ergoConfig.secretKey,
                inputBoxes,
                [outPermit, outCommitment],
                height
            )
            await ErgoNetwork.sendTx(signed.to_json())
            console.log("Commitment creation done with txId: ", signed.id().to_str())
            return {
                txId: signed.id().to_str(),
                commitmentBoxId: signed.outputs().get(1).box_id().to_str(),
            }
        } catch (e) {
            console.log(e)
            if (e instanceof boxCreationError) {
                console.log("Transaction input and output doesn't match. Input boxesSample assets must be more or equal to the outputs assets.")
            }
            console.log("Skipping the commitment creation.")
            return {}
        }
    }

    /**
     * Extracts the confirmed observations and creates the commitment transaction
     * Finally saves the created commitment in the database
     */
    job = async () => {
        const observations = await this._dataBaseConnection.allReadyObservations()
        if(!this._widApi.watcherWID) {
            console.log("Watcher WID is not set, can not run commitment creation job.")
            return
        }
        const WID = this._widApi.watcherWID
        console.log("starting commitment creation job with ", observations.length, " number of ready observations")
        for (const observation of observations) {
            try {
                const commitment = ErgoUtils.commitmentFromObservation(observation, WID)
                const permits = await this._boxes.getPermits(BigInt(0))
                const WIDBox = await this._boxes.getWIDBox()
                const totalValue: bigint = permits.map(permit =>
                        BigInt(permit.value().as_i64().to_str()))
                        .reduce((a, b) => a + b, BigInt(0)) +
                    BigInt(WIDBox.value().as_i64().to_str())
                console.log("WID Box: ", WIDBox.box_id().to_str(), WIDBox.value().as_i64().to_str())
                const requiredValue = BigInt(rosenConfig.fee) + BigInt(rosenConfig.minBoxValue) * BigInt(3)
                let feeBoxes: Array<wasm.ErgoBox> = []
                console.log("Total value is: ", totalValue, " Required value is: ", requiredValue)
                if (totalValue < requiredValue) {
                    feeBoxes = await this._boxes.getUserPaymentBox(requiredValue - totalValue)
                }
                const txInfo = await this.createCommitmentTx(WID, observation.requestId, commitment, permits, WIDBox, feeBoxes)
                if (txInfo.commitmentBoxId !== undefined)
                    await this._dataBaseConnection.updateObservation(txInfo.commitmentBoxId, observation)
            } catch(e) {
                if(!(e instanceof NotEnoughFund))
                    console.log(e)
                console.log("Skipping the commitment creation")
            }
        }
    }
}
