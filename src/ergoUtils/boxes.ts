import * as wasm from "ergo-lib-wasm-nodejs";
import { contracts } from "../contracts/contracts";
import { tokens } from "../../config/default";
import { contractHash, hexStrToUint8Array } from "./ergoUtils";
import config from "config";
import { Observation } from "../objects/interfaces";
import { Buffer } from "buffer";
import { bigIntToUint8Array } from "../utils/utils";

const permitBox = require('./dataset/permitBox.json');
const WIDBox = require('./dataset/WIDBox.json');
const feeBox = require('./dataset/feeBox.json');

export class boxes {
    static getPermits = async (WID: string): Promise<Array<wasm.ErgoBox>> => {
        // TODO: Implement this mocked function
        return Promise.resolve([wasm.ErgoBoxes.from_boxes_json(permitBox).get(0)])
    }

    static getWIDBox = async (WID: string): Promise<Array<wasm.ErgoBox>> => {
        // TODO: Implement this mocked function
        return Promise.resolve([wasm.ErgoBoxes.from_boxes_json(WIDBox).get(0)])
    }

    static getFeeBox = async (value: number): Promise<wasm.ErgoBox> => {
        // TODO: Implement this mocked function
        return Promise.resolve(wasm.ErgoBox.from_json(feeBox))
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
            contracts.addressCache.permitContract!,
            height
        );
        if(RWTCount > 0) {
            builder.add_token(wasm.TokenId.from_str(tokens.RWT),
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
        const contract = contracts.addressCache.commitmentContract!
        const builder = new wasm.ErgoBoxCandidateBuilder(
            wasm.BoxValue.from_i64(wasm.I64.from_str(value.toString())),
            contract,
            height
        );
        builder.add_token(wasm.TokenId.from_str(tokens.RWT),
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
        const address = wasm.Address.from_base58(config.get("ergo.address"))
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
            contracts.addressCache.eventTriggerContract!,
            height
        );
        builder.add_token(wasm.TokenId.from_str(tokens.RWT),
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
        const permitHash = contractHash(contracts.addressCache.permitContract!)
        builder.set_register_value(4, wasm.Constant.from_coll_coll_byte(WIDs))
        builder.set_register_value(5, wasm.Constant.from_coll_coll_byte(eventData))
        builder.set_register_value(6, wasm.Constant.from_byte_array(permitHash))
        return builder.build()
    }
}

