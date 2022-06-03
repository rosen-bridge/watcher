import { CommitmentScript, EventTrigerScript, FraudScript, RwtRepoScript, WatcherPermitScript } from "./scripts";
import { strToUint8Array } from "../utils/utils";
import { ErgoNetwork } from "../ergo/network/ergoNetwork";
import * as wasm from "ergo-lib-wasm-nodejs";
import { rosenConfig } from "./rosenConfig";
import { Config } from "../../config/config";

let blake2b = require('blake2b');

const config = Config.getConfig();

export class Contracts{
    fraud?: string;
    trigerEvent?: string;
    commitment?: string;
    permit?: string;
    RWTRepo?: string;
    ergoNetwork: ErgoNetwork;
    repoNFT: Uint8Array;
    guardNFT: Uint8Array;

    constructor() {
        this.ergoNetwork = new ErgoNetwork();
        this.repoNFT = strToUint8Array(config.RepoNFT);
        this.guardNFT = strToUint8Array(rosenConfig.guardNFT);
    }

    P2SAToScriptHash = (P2SA: string) => {
        const contract = wasm.Contract.pay_to_address(wasm.Address.from_base58(P2SA));
        return Buffer.from(
            blake2b(32)
                .update(
                    Buffer.from(
                        contract.ergo_tree().to_base16_bytes(),
                        "hex"
                    )
                )
                .digest()
        ).toString("hex");
    }

    generateRWTRepoContractAddress = async () => {
        if (this.RWTRepo === undefined) {
            const watcherPermitHash = strToUint8Array(this.P2SAToScriptHash(await this.generateWatcherPermitContract()));
            const RSNToken = strToUint8Array(rosenConfig.RSN);
            const script = RwtRepoScript
                .replace("GUARD_NFT", Buffer.from(this.guardNFT).toString('base64'))
                .replace("RSN_TOKEN", Buffer.from(RSNToken).toString('base64'))
                .replace("PERMIT_SCRIPT_HASH", Buffer.from(watcherPermitHash).toString('base64'));
            this.RWTRepo = await this.ergoNetwork.pay2ScriptAddress(script);
        }
        return this.RWTRepo;

    }

    generateWatcherPermitContract = async () => {
        if (this.permit === undefined) {
            const commitmentScriptHash = strToUint8Array(this.P2SAToScriptHash(await this.generateCommitmentContract()));
            const script = WatcherPermitScript
                .replace("REPO_NFT", Buffer.from(this.repoNFT).toString('base64'))
                .replace("COMMITMENT_SCRIPT_HASH", Buffer.from(commitmentScriptHash).toString('base64'));
            this.permit = await this.ergoNetwork.pay2ScriptAddress(script);
        }
        return this.permit;
    }

    generateCommitmentContract = async () => {
        if (this.commitment === undefined) {
            const trigerEventScriptHash = strToUint8Array(this.P2SAToScriptHash(await this.generateWatcherTriggerEventContract()));
            const script = CommitmentScript
                .replace("REPO_NFT", Buffer.from(this.repoNFT).toString('base64'))
                .replace("EVENT_TRIGGER_SCRIPT_HASH", Buffer.from(trigerEventScriptHash).toString('base64'));
            this.commitment = await this.ergoNetwork.pay2ScriptAddress(script);
        }
        return this.commitment;
    }

    generateWatcherTriggerEventContract = async () => {
        if (this.trigerEvent === undefined) {
            const cleanUpNFT = strToUint8Array(rosenConfig.cleanupNFT);
            const cleanupConfirm = rosenConfig.cleanupConfirm;
            const fraudScriptHash = strToUint8Array(this.P2SAToScriptHash(await this.generateFraudContract()));
            const script = EventTrigerScript
                .replace("GUARD_NFT", Buffer.from(this.guardNFT).toString('base64'))
                .replace("CLEANUP_NFT", Buffer.from(cleanUpNFT).toString('base64'))
                .replace("FRAUD_SCRIPT_HASH", Buffer.from(fraudScriptHash).toString('base64'))
                .replace("CLEANUP_CONFIRMATION", cleanupConfirm.toString());
            this.trigerEvent = await this.ergoNetwork.pay2ScriptAddress(script);
        }
        return this.trigerEvent;
    }

    generateFraudContract = async () => {
        if (this.fraud === undefined) {
            const cleanUpNFT = strToUint8Array(rosenConfig.cleanupNFT);
            const script = FraudScript
                .replace("CLEANUP_NFT", Buffer.from(cleanUpNFT).toString('base64'))
                .replace("REPO_NFT", Buffer.from(this.repoNFT).toString('base64'));

            this.fraud = await this.ergoNetwork.pay2ScriptAddress(script);
        }
        return this.fraud;
    }

}
