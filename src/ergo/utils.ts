import * as wasm from "ergo-lib-wasm-nodejs";
import { ErgoBox } from "ergo-lib-wasm-nodejs";
import { Observation } from "../utils/interfaces";
import { bigIntToUint8Array } from "../utils/utils";
import { rosenConfig } from "../config/rosenConfig";
import { ErgoNetwork } from "./network/ergoNetwork";
import { boxCreationError } from "../errors/errors";
import { blake2b } from "blakejs";
import { Buffer } from "buffer";

const txFee = parseInt(rosenConfig.fee)

export const extractBoxes = (boxes: wasm.ErgoBoxes): Array<wasm.ErgoBox> => {
    return Array(boxes.len()).fill("")
        .map((item, index) => boxes.get(index))
}
export const extractTokens = (tokens: wasm.Tokens): Array<wasm.Token> => {
    return Array(tokens.len()).fill("")
        .map((item, index) => tokens.get(index))
}
export const decodeSerializedBox = (boxSerialized: string) => {
    return wasm.ErgoBox.sigma_parse_bytes(new Uint8Array(Buffer.from(boxSerialized, "base64")))
}
export const boxHaveAsset = (box: ErgoBox, asset: string) => {
    return extractTokens(box.tokens()).map(token => token.id().to_str()).includes(asset)
}


export class ErgoUtils {
    /**
     * Creates a change box from the input and output boxesSample
     * if output boxesSample have more assets than the inputs throws an exception
     * if some input assets needs to be burnt throw exception
     * if all input assets were transferred to the outputs returns null
     * @param boxes
     * @param candidates
     * @param height
     * @param secret
     * @param contract change contract if it is needed, unless use the secret's public address as the change address
     */
    static createChangeBox = (boxes: wasm.ErgoBoxes, candidates: Array<wasm.ErgoBoxCandidate>, height: number, secret: wasm.SecretKey, contract?: wasm.Contract): wasm.ErgoBoxCandidate | null => {
        const processBox = (box: wasm.ErgoBox | wasm.ErgoBoxCandidate, tokens: { [id: string]: bigint; }, sign: number) => {
            extractTokens(box.tokens()).forEach(token => {
                if (!Object.hasOwnProperty.call(tokens, token.id().to_str())) {
                    tokens[token.id().to_str()] = BigInt(token.amount().as_i64().as_num() * sign)
                } else {
                    tokens[token.id().to_str()] += BigInt(token.amount().as_i64().as_num() * sign)
                }
            })
        }
        let value = BigInt(0);
        const tokens: { [id: string]: bigint; } = {}
        extractBoxes(boxes).forEach(box => {
            value += BigInt(box.value().as_i64().to_str())
            processBox(box, tokens, 1)
        })
        candidates.forEach(candidate => {
            value -= BigInt(candidate.value().as_i64().to_str())
            processBox(candidate, tokens, -1)
        })
        if (value > BigInt(txFee + wasm.BoxValue.SAFE_USER_MIN().as_i64().as_num())) {
            const change = new wasm.ErgoBoxCandidateBuilder(
                wasm.BoxValue.from_i64(wasm.I64.from_str((value - BigInt(txFee)).toString())),
                contract ? contract : wasm.Contract.pay_to_address(secret.get_address()),
                height
            )
            Object.entries(tokens).forEach(([key, value]) => {
                if (value > 0) {
                    change.add_token(wasm.TokenId.from_str(key), wasm.TokenAmount.from_i64(wasm.I64.from_str(value.toString())))
                } else if (value < 0) {
                    throw new boxCreationError
                }
            })
            return change.build()
        } else if (value < 0) {
            throw new boxCreationError
        } else {
            Object.entries(tokens).forEach(([, value]) => {
                if (value !== BigInt(0)) {
                    throw new boxCreationError
                }
            })
        }
        return null
    }

    /**
     * signs the transaction by required secret
     * @param builder
     * @param secret
     * @param inputs
     * @param dataInputs
     */
    static buildTxAndSign = async (builder: wasm.TxBuilder,
                            secret: wasm.SecretKey,
                            inputs: wasm.ErgoBoxes,
                            dataInputs: wasm.ErgoBoxes = wasm.ErgoBoxes.from_boxes_json([])) => {
        const tx = builder.build();
        const secrets = new wasm.SecretKeys()
        secrets.add(secret)
        const wallet = wasm.Wallet.from_secrets(secrets);
        const ctx = await ErgoNetwork.getErgoStateContext();
        return wallet.sign_transaction(ctx, tx, inputs, dataInputs)
    }

    /**
     * Creates the transaction from input, data input and output boxesSample, then signs the created transaction with the secrets
     * @param secret
     * @param boxes inout boxesSample
     * @param candidates output boxesSample
     * @param height current network height
     * @param dataInputs
     * @param changeContract change contract if it is needed, unless use the secret's public address as the change address
     */
    static createAndSignTx = async (secret: wasm.SecretKey,
                                    boxes: wasm.ErgoBoxes,
                                    candidates: Array<wasm.ErgoBoxCandidate>,
                                    height: number,
                                    dataInputs?: wasm.ErgoBoxes,
                                    changeContract?: wasm.Contract): Promise<wasm.Transaction> => {
        const change = ErgoUtils.createChangeBox(boxes, candidates, height, secret, changeContract)
        const candidateBoxes = new wasm.ErgoBoxCandidates(candidates[0])
        candidates.slice(1).forEach(item => candidateBoxes.add(item))
        if (change) {
            candidateBoxes.add(change)
        }
        const boxSelection = new wasm.BoxSelection(boxes, new wasm.ErgoBoxAssetsDataList());
        const txBuilder = wasm.TxBuilder.new(
            boxSelection,
            candidateBoxes,
            height,
            wasm.BoxValue.from_i64(wasm.I64.from_str(txFee.toString())),
            secret.get_address(),
            wasm.BoxValue.from_i64(wasm.I64.from_str(txFee.toString()))
        )
        if (dataInputs) {
            const txDataInputs = new wasm.DataInputs()
            Array(dataInputs.len()).fill("").forEach((item, index) => txDataInputs.add(new wasm.DataInput(dataInputs.get(index).box_id())))
            txBuilder.set_data_inputs(txDataInputs)
        }
        return ErgoUtils.buildTxAndSign(txBuilder, secret, boxes, dataInputs ? dataInputs : wasm.ErgoBoxes.from_boxes_json([]))
    }

    /**
     * Creates commitment from observation information and the watcher WID
     * @param observation
     * @param WID
     */
    static commitmentFromObservation = (observation: Observation, WID: string): Uint8Array => {
        const content = Buffer.concat([
            Buffer.from(observation.sourceTxId),
            Buffer.from(observation.fromChain),
            Buffer.from(observation.toChain),
            Buffer.from(observation.fromAddress),
            Buffer.from(observation.toAddress),
            bigIntToUint8Array(BigInt(observation.amount)),
            bigIntToUint8Array(BigInt(observation.bridgeFee)),
            bigIntToUint8Array(BigInt(observation.networkFee)),
            Buffer.from(observation.sourceChainTokenId),
            Buffer.from(observation.targetChainTokenId),
            Buffer.from(observation.sourceBlockId),
            Buffer.from(WID, "hex"),
        ])
        return blake2b(content, undefined, 32)
    }

    /**
     * Produces the contract hash
     * @param contract
     */
    static contractHash = (contract: wasm.Contract): Buffer => {
        return Buffer.from(
            blake2b(Buffer.from(contract.ergo_tree().to_base16_bytes(), "hex"), undefined, 32)
        )
    }

    /**
     * returns the required number of commitments to merge creating an event trigger
     * @param repo
     */
    static requiredCommitmentCount = (repo: wasm.ErgoBox): bigint => {
        const R6 = repo.register_value(6)
        const R4 = repo.register_value(4)
        if (!R6 || !R4) throw new Error("Bad Repo Box response")
        const r6: Array<string> = R6.to_i64_str_array()
        const r4 = R4.to_coll_coll_byte()
        const max = BigInt(r6[3])
        const min = BigInt(r6[2])
        const percentage = parseInt(r6[1])
        const watcherCount = r4.length
        const formula = min + BigInt(Math.ceil(percentage * (watcherCount - 1) / (100)))
        return max < formula ? max : formula
    }
}
