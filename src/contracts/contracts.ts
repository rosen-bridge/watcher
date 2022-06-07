import { ErgoNetworkApi } from "../ergoUtils/networkApi";
import { scripts } from "./scripts";
import { tokens } from "../../config/default";
import * as wasm from "ergo-lib-wasm-nodejs";
import config from "config";
import { contractHash } from "../ergoUtils/ergoUtils";

export interface AddressCache {
    fraud?: string
    eventTrigger?: string
    commitment?: string
    commitmentContract?: wasm.Contract
    permit?: string
    permitContract?: wasm.Contract
}

export class contracts {
    static addressCache: AddressCache = {}

    static init = async () => {
        const replacedFraudScript = scripts.fraudScript
            .replace("REPO_NFT", Buffer.from(tokens.RepoNFT, "hex").toString("base64"))
            .replace("CLEANUP_NFT", Buffer.from(tokens.CleanupNFT, "hex").toString("base64"))
        this.addressCache.fraud = await ErgoNetworkApi.pay2ScriptAddress(replacedFraudScript)
        const fraudContract = wasm.Contract.pay_to_address(wasm.Address.from_base58(this.addressCache.fraud));
        const fraudHash = contractHash(fraudContract).toString("base64")

        const replacedEventTriggerScript = scripts.eventTriggerScript
            .replace("GUARD_NFT", Buffer.from(tokens.GuardNFT, "hex").toString("base64"))
            .replace("CLEANUP_NFT", Buffer.from(tokens.CleanupNFT, "hex").toString("base64"))
            .replace("FRAUD_SCRIPT_HASH", fraudHash)
            .replace("CLEANUP_CONFIRMATION", config.get?.('commitmentScanner.cleanupConfirmation'))
        this.addressCache.eventTrigger = await ErgoNetworkApi.pay2ScriptAddress(replacedEventTriggerScript)
        const eventTriggerContract = wasm.Contract.pay_to_address(wasm.Address.from_base58(this.addressCache.eventTrigger));
        const eventTriggerHash = contractHash(eventTriggerContract).toString("base64")

        const replacedCommitmentScript = scripts.commitmentScript
            .replace("EVENT_TRIGGER_SCRIPT_HASH", eventTriggerHash)
        this.addressCache.commitment = await ErgoNetworkApi.pay2ScriptAddress(replacedCommitmentScript)
        this.addressCache.commitmentContract = wasm.Contract.pay_to_address(wasm.Address.from_base58(this.addressCache.commitment));
        const commitmentHash = contractHash(this.addressCache.commitmentContract).toString("base64")

        const replacedPermitScript = scripts.permitScript
            .replace("REPO_NFT", Buffer.from(tokens.RepoNFT, "hex").toString("base64"))
            .replace("COMMITMENT_SCRIPT_HASH", commitmentHash)
        this.addressCache.permit = await ErgoNetworkApi.pay2ScriptAddress(replacedPermitScript)
        this.addressCache.permitContract = wasm.Contract.pay_to_address(wasm.Address.from_base58(this.addressCache.permit));
    }
}
