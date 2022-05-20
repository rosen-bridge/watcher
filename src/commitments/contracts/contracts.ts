import {ErgoNetworkApi} from "../network/networkApi";
import {scripts} from "./scripts";
import {tokens} from "../../../config/default";
import * as wasm from "ergo-lib-wasm-nodejs";
import { blake2b } from "ethereum-cryptography/blake2b";

interface AddressCache {
    fraud: string;
    eventTrigger: string;
    commitment: string;
}

export class contracts{
    static addressCache: AddressCache

    static init = async (networkApi: ErgoNetworkApi) => {
        const replacedFraudScript = scripts.fraudScript
            .replace("REPO_NFT", Buffer.from(tokens.GuardNFT, "hex").toString("base64"))
            .replace("CLEANUP_NFT", Buffer.from(tokens.CleanupNFT, "hex").toString("base64"))
        this.addressCache.fraud = await networkApi.pay2ScriptAddress(replacedFraudScript)
        const fraudContract = wasm.Contract.pay_to_address(wasm.Address.from_base58(this.addressCache.fraud));
        const fraudHash = blake2b(Buffer.from(fraudContract.ergo_tree().to_base16_bytes(), "hex"), 32)

        const replacedEventTriggerScript = scripts.eventTriggerScript
            .replace("REPO_NFT", Buffer.from(tokens.GuardNFT, "hex").toString("base64"))
            .replace("CLEANUP_NFT", Buffer.from(tokens.CleanupNFT, "hex").toString("base64"))
            .replace("FRAUD_SCRIPT_HASH", fraudHash.toString("base64"))
        this.addressCache.eventTrigger = await networkApi.pay2ScriptAddress(replacedEventTriggerScript)
        const eventTriggerContract = wasm.Contract.pay_to_address(wasm.Address.from_base58(this.addressCache.eventTrigger));
        const eventTriggerHash = blake2b(Buffer.from(eventTriggerContract.ergo_tree().to_base16_bytes(), "hex"), 32)

        const replacedCommitmentScript = scripts.commitmentScript
            .replace("EVENT_TRIGGER_SCRIPT_HASH", eventTriggerHash.toString("base64"))
        this.addressCache.commitment = await networkApi.pay2ScriptAddress(replacedCommitmentScript)
    }
}
