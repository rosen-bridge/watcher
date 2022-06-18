import * as wasm from "ergo-lib-wasm-nodejs";
import { SecretKey } from "ergo-lib-wasm-nodejs";
import { Observation } from "../objects/interfaces";
import { bigIntToUint8Array} from "../utils/utils";
import { rosenConfig } from "../config/rosenConfig";
import { ErgoNetwork } from "./network/ergoNetwork";
import { boxCreationError } from "../errors/errors";
import { blake2b } from "blakejs";

const txFee = parseInt(rosenConfig.fee)

export const extractBoxes = (boxes: wasm.ErgoBoxes): Array<wasm.ErgoBox> => {
    return Array(boxes.len()).fill("")
        .map((item, index) => boxes.get(index))
}
export const extractTokens = (tokens: wasm.Tokens): Array<wasm.Token> => {
    return Array(tokens.len()).fill("")
        .map((item, index) => tokens.get(index))
}
export const ergoTreeToAddress = (ergoTree: wasm.ErgoTree): wasm.Address => {
    return wasm.Address.recreate_from_ergo_tree(ergoTree)
}
export const ergoTreeToBase58Address = (ergoTree: wasm.ErgoTree,
                                        networkType: wasm.NetworkPrefix = wasm.NetworkPrefix.Mainnet): string => {
    return ergoTreeToAddress(ergoTree).to_base58(networkType)
}
export const decodeCollColl = async (str: string): Promise<Uint8Array[]> => {
    return wasm.Constant.decode_from_base16(str).to_coll_coll_byte()
}
export const decodeStr = async (str: string): Promise<string> => {
    return Buffer.from(wasm.Constant.decode_from_base16(str).to_byte_array()).toString('hex')
}
export const hexStrToUint8Array = (str: string): Uint8Array => {
    return new Uint8Array(Buffer.from(str, "hex"))
}
export const generateSK = (): SecretKey => {
    return wasm.SecretKey.random_dlog();
}

/**
 * Creates a change box from the input and output boxes
 * if output boxes have more assets than the inputs throws an exception
 * if some input assets needs to be burnt throw exception
 * if all input assets were transferred to the outputs returns null
 * @param boxes
 * @param candidates
 * @param height
 * @param secret
 * @param contract change contract if it is needed, unless use the secret's public address as the change address
 */
export const createChangeBox = (boxes: wasm.ErgoBoxes, candidates: Array<wasm.ErgoBoxCandidate>, height: number, secret: wasm.SecretKey, contract?: wasm.Contract): wasm.ErgoBoxCandidate | null => {
    const processBox = (box: wasm.ErgoBox | wasm.ErgoBoxCandidate, tokens: { [id: string]: bigint; }, sign: number) => {
        extractTokens(box.tokens()).forEach(token => {
            if (!tokens.hasOwnProperty(token.id().to_str())) {
                tokens[token.id().to_str()] = BigInt(token.amount().as_i64().as_num() * sign)
            } else {
                tokens[token.id().to_str()] += BigInt(token.amount().as_i64().as_num() * sign)
            }
        })
    }
    let value: bigint = BigInt(0);
    let tokens: { [id: string]: bigint; } = {}
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
        Object.entries(tokens).forEach(([key, value]) => {
            if (value !== BigInt(0)) {
                throw new boxCreationError
            }
        })
    }
    return null
}

/**
 * signs the transaction by required secret
 * @param secret
 * @param tx
 * @param boxSelection
 * @param dataInputs
 */
const signTx = async (secret: wasm.SecretKey, tx: wasm.UnsignedTransaction, boxSelection: wasm.BoxSelection, dataInputs: wasm.ErgoBoxes) => {
    const secrets = new wasm.SecretKeys()
    secrets.add(secret)
    const wallet = wasm.Wallet.from_secrets(secrets);
    const ctx = await ErgoNetwork.getErgoStateContext();
    return wallet.sign_transaction(ctx, tx, boxSelection.boxes(), dataInputs)
}

/**
 * Creates the transaction from input, data input and output boxes, then signs the created transaction with the secrets
 * @param secret
 * @param boxes inout boxes
 * @param candidates output boxes
 * @param height current network height
 * @param dataInputs
 * @param changeContract change contract if it is needed, unless use the secret's public address as the change address
 */
export const createAndSignTx = async (secret: wasm.SecretKey, boxes: wasm.ErgoBoxes, candidates: Array<wasm.ErgoBoxCandidate>, height: number, dataInputs?: wasm.ErgoBoxes, changeContract?: wasm.Contract) => {
    const change = createChangeBox(boxes, candidates, height, secret, changeContract)
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
    return signTx(secret, txBuilder.build(), boxSelection, dataInputs ? dataInputs : wasm.ErgoBoxes.from_boxes_json([]))
}

/**
 * Creates commitment from observation information and the watcher WID
 * @param observation
 * @param WID
 */
export const commitmentFromObservation = (observation: Observation, WID: string): Uint8Array => {
    const content = Buffer.concat([
        Buffer.from(observation.sourceTxId, "hex"),
        Buffer.from(observation.fromChain),
        Buffer.from(observation.toChain),
        Buffer.from(observation.fromAddress),
        Buffer.from(observation.toAddress),
        bigIntToUint8Array(BigInt(observation.amount)),
        bigIntToUint8Array(BigInt(observation.fee)),
        Buffer.from(observation.sourceChainTokenId, "hex"),
        Buffer.from(observation.targetChainTokenId, "hex"),
        Buffer.from(observation.sourceBlockId, "hex"),
        Buffer.from(WID, "hex"),
    ])
    return blake2b(content, undefined, 32)
}

/**
 * Produces the contract hash
 * @param contract
 */
export const contractHash = (contract: wasm.Contract): Buffer => {
    return Buffer.from(
        blake2b(Buffer.from(contract.ergo_tree().to_base16_bytes(), "hex"), undefined, 32)
    )
}
