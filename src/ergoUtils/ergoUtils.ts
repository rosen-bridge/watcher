import * as wasm from "ergo-lib-wasm-nodejs";
import { ErgoBox } from "ergo-lib-wasm-nodejs";
import config from "config";
import { ErgoNetworkApi } from "./networkApi";
import { Buffer } from "buffer";
import { Observation } from "../objects/interfaces";
import { bigIntToUint8Array } from "../utils/utils";
let blake2b = require('blake2b')

const networkType: wasm.NetworkPrefix = config.get?.('ergo.networkType');
const txFee = parseInt(config.get?.('ergo.txFee'))

export const extractBoxes = (tx: wasm.Transaction): Array<ErgoBox> => {
    return Array(tx.outputs().len()).fill("")
        .map((item, index) => tx.outputs().get(index))
}
export const extractTokens = (tokens: wasm.Tokens): Array<wasm.Token> => {
    return Array(tokens.len()).fill("")
        .map((item, index) => tokens.get(index))
}
export const ergoTreeToAddress = (ergoTree: wasm.ErgoTree): wasm.Address => {
    return wasm.Address.recreate_from_ergo_tree(ergoTree)
}
export const ergoTreeToBase58Address = (ergoTree: wasm.ErgoTree): string => {
    return ergoTreeToAddress(ergoTree).to_base58(networkType)
}
export const decodeCollColl = async (str: string): Promise<Uint8Array[]> => {
    return wasm.Constant.decode_from_base16(str).to_coll_coll_byte()
}
export const decodeStr = async (str: string): Promise<string> => {
    return Buffer.from(wasm.Constant.decode_from_base16(str).to_byte_array()).toString('hex')
}
export const strToUint8Array = (str: string): Uint8Array => {
    return new Uint8Array(Buffer.from(str, "hex"))
}

const createChangeBox = (boxes: wasm.ErgoBoxes, candidates: Array<wasm.ErgoBoxCandidate>, height: number, secret: wasm.SecretKey, contract?: wasm.Contract): wasm.ErgoBoxCandidate | null => {
    const processBox = (box: wasm.ErgoBox | wasm.ErgoBoxCandidate, tokens: { [id: string]: number; }, sign: number) => {
        Array(box.tokens().len()).fill("").forEach((notUsed, tokenIndex) => {
            const token = box.tokens().get(tokenIndex);
            if (!tokens.hasOwnProperty(token.id().to_str())) {
                tokens[token.id().to_str()] = token.amount().as_i64().as_num() * sign
            } else {
                tokens[token.id().to_str()] += token.amount().as_i64().as_num() * sign
            }
        })
    }
    let value: number = 0;
    let tokens: { [id: string]: number; } = {}
    Array(boxes.len()).fill("").forEach((item, index) => {
        const box = boxes.get(index);
        value += box.value().as_i64().as_num()
        processBox(box, tokens, 1)
    });
    candidates.forEach(candidate => {
        value -= candidate.value().as_i64().as_num()
        processBox(candidate, tokens, -1)
    })
    const changeTokens = Object.entries(tokens).filter(([key, value]) => value > 0)
    if (value > txFee + wasm.BoxValue.SAFE_USER_MIN().as_i64().as_num()) {
        const change = new wasm.ErgoBoxCandidateBuilder(
            wasm.BoxValue.from_i64(wasm.I64.from_str((value - txFee).toString())),
            contract ? contract : wasm.Contract.pay_to_address(secret.get_address()),
            height
        )
        Object.entries(tokens).forEach(([key, value]) => {
            if (value > 0) {
                change.add_token(wasm.TokenId.from_str(key), wasm.TokenAmount.from_i64(wasm.I64.from_str(value.toString())))
            }
        })
        return change.build()
    }
    return null
}

const signTx = async (secret: wasm.SecretKey, tx: wasm.UnsignedTransaction, boxSelection: wasm.BoxSelection, dataInputs: wasm.ErgoBoxes) => {
    const secrets = new wasm.SecretKeys()
    secrets.add(secret)
    const wallet = wasm.Wallet.from_secrets(secrets);
    const ctx = await ErgoNetworkApi.getErgoStateContext();
    return wallet.sign_transaction(ctx, tx, boxSelection.boxes(), dataInputs)
}

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
    return blake2b(32).update(content).digest()
}

export const contractHash = (contract: wasm.Contract): Buffer => {
    return Buffer.from(
        blake2b(32)
            .update(Buffer.from(contract.ergo_tree().to_base16_bytes(), "hex"))
            .digest()
    )
}
