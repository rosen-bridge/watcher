import * as wasm from "ergo-lib-wasm-nodejs";
import { contractHash, hexStrToUint8Array } from "./utils";
import { ErgoConfig } from "../config/config";
import { rosenConfig } from "../config/rosenConfig";
import { bigIntToUint8Array, NotEnoughFund } from "../utils/utils";
import { CommitmentDataBase } from "../commitments/models/commitmentModel";
import { boxType } from "../entities/BoxEntity";
import { Observation } from "../objects/interfaces";
import { ErgoNetwork } from "./network/ergoNetwork";

const ergoConfig = ErgoConfig.getConfig();


export class Boxes {
    _dataBase: CommitmentDataBase

    constructor(db: CommitmentDataBase) {
        this._dataBase = db
    }

    getPermits = async (): Promise<Array<wasm.ErgoBox>> => {
        const permits = await this._dataBase.getUnspentSpecialBoxes(boxType.PERMIT)
        const permitBoxes = permits.map(async (permit) => {
            const box = wasm.ErgoBox.from_json(permit.boxJson)
            return await ErgoNetwork.trackMemPool(box)
        })
        return Promise.all(permitBoxes)
    }

    getWIDBox = async (): Promise<wasm.ErgoBox> => {
        const WID = (await this._dataBase.getUnspentSpecialBoxes(boxType.PERMIT))[0]
        let WIDBox = wasm.ErgoBox.from_json(WID.boxJson)
        WIDBox = await ErgoNetwork.trackMemPool(WIDBox)
        return WIDBox
    }

    getUserPaymentBox = async (requiredValue: number): Promise<Array<wasm.ErgoBox>> => {
        const boxes = await this._dataBase.getUnspentSpecialBoxes(boxType.PERMIT)
        let selectedBoxes = []
        let totalValue = BigInt(0)
        for(const box of boxes){
            totalValue = totalValue + BigInt(box.value)
            selectedBoxes.push(box)
            if(totalValue > requiredValue) break
        }
        if(totalValue < requiredValue){
            console.log("ERROR: Not enough fund to create the transaction")
            throw NotEnoughFund
        }
        const outBoxes = selectedBoxes.map(async (fund) => {
            const box = wasm.ErgoBox.from_json(fund.boxJson)
            return await ErgoNetwork.trackMemPool(box)
        })
        return Promise.all(outBoxes)
    }

    /**
     * creates a new permit box with required data
     * @param value
     * @param height
     * @param RWTCount
     * @param WID
     */
    static createPermit = (value: bigint, height: number, RWTCount: bigint, WID: string): wasm.ErgoBoxCandidate => {
        const builder = new wasm.ErgoBoxCandidateBuilder(
            wasm.BoxValue.from_i64(wasm.I64.from_str(value.toString())),
            wasm.Contract.pay_to_address(wasm.Address.from_base58(rosenConfig.watcherPermitAddress)),
            height
        );
        if (RWTCount > 0) {
            builder.add_token(wasm.TokenId.from_str(ergoConfig.RWTId),
                wasm.TokenAmount.from_i64(wasm.I64.from_str(RWTCount.toString())))
        }
        builder.set_register_value(4, wasm.Constant.from_coll_coll_byte([hexStrToUint8Array(WID)]))
        return builder.build()
    }

    /**
     * creates a new commitment box with the required information on registers
     * @param value
     * @param height
     * @param WID
     * @param requestId
     * @param eventDigest
     * @param permitScriptHash
     */
    static createCommitment = (value: bigint, height: number, WID: string, requestId: string, eventDigest: Uint8Array, permitScriptHash: Uint8Array): wasm.ErgoBoxCandidate => {
        const contract = wasm.Contract.pay_to_address(wasm.Address.from_base58(rosenConfig.commitmentAddress));
        const builder = new wasm.ErgoBoxCandidateBuilder(
            wasm.BoxValue.from_i64(wasm.I64.from_str(value.toString())),
            contract,
            height
        );
        builder.add_token(wasm.TokenId.from_str(ergoConfig.RWTId),
            wasm.TokenAmount.from_i64(wasm.I64.from_str("1")))
        builder.set_register_value(4, wasm.Constant.from_coll_coll_byte([hexStrToUint8Array(WID)]))
        builder.set_register_value(5, wasm.Constant.from_coll_coll_byte([hexStrToUint8Array(requestId)]))
        builder.set_register_value(6, wasm.Constant.from_byte_array(eventDigest))
        builder.set_register_value(7, wasm.Constant.from_byte_array(permitScriptHash))
        return builder.build()
    }

    /**
     * creates user payment box, it should contain the WID token and collected rewards
     * @param value
     * @param height
     * @param tokens
     */
    static createPayment = (value: bigint, height: number, tokens: Array<wasm.Token>): wasm.ErgoBoxCandidate => {
        const address = wasm.SecretKey.dlog_from_bytes(hexStrToUint8Array(ergoConfig.secretKey)).get_address()
        const builder = new wasm.ErgoBoxCandidateBuilder(
            wasm.BoxValue.from_i64(wasm.I64.from_str(value.toString())),
            wasm.Contract.pay_to_address(address),
            height
        );
        tokens.forEach(token => {
            builder.add_token(token.id(), token.amount())
        })
        return builder.build()
    }

    /**
     * Creates trigger event box with the aggregated information of WIDs
     * @param value
     * @param height
     * @param WIDs
     * @param observation
     */
    static createTriggerEvent = (value: bigint, height: number, WIDs: Array<Uint8Array>, observation: Observation) => {
        const builder = new wasm.ErgoBoxCandidateBuilder(
            wasm.BoxValue.from_i64(wasm.I64.from_str(value.toString())),
            wasm.Contract.pay_to_address(wasm.Address.from_base58(rosenConfig.eventTriggerAddress)),
            height
        );
        builder.add_token(wasm.TokenId.from_str(ergoConfig.RWTId),
            wasm.TokenAmount.from_i64(wasm.I64.from_str(WIDs.length.toString())))
        const eventData = [
            Buffer.from(observation.sourceTxId, "hex"),
            Buffer.from(observation.fromChain),
            Buffer.from(observation.toChain),
            Buffer.from(observation.fromAddress),
            Buffer.from(observation.toAddress),
            bigIntToUint8Array(BigInt(observation.amount)),
            bigIntToUint8Array(BigInt(observation.fee)),
            Buffer.from(observation.sourceChainTokenId, "hex"),
            Buffer.from(observation.targetChainTokenId, "hex"),
            Buffer.from(observation.sourceBlockId, "hex")]
        const permitHash = contractHash(wasm.Contract.pay_to_address(wasm.Address.from_base58(rosenConfig.watcherPermitAddress)))
        builder.set_register_value(4, wasm.Constant.from_coll_coll_byte(WIDs))
        builder.set_register_value(5, wasm.Constant.from_coll_coll_byte(eventData))
        builder.set_register_value(6, wasm.Constant.from_byte_array(permitHash))
        return builder.build()
    }
}

