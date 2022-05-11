import { RwtRepoScript } from "./scripts";
import { strToUint8Array } from "../utils/utils";
import { ErgoNetwork } from "../ergo/network/ergoNetwork";
import * as ergoLib from "ergo-lib-wasm-nodejs";


export class Contracts {
    //TODO: cache should be added

    static generateRWTRepoContractAddress = async () => {
        //TODO: should added to config later
        const guardNFT = "3333333333333333333333333333333333333333333333333333333333333333";
        const RSNToken = "1111111111111111111111111111111111111111111111111111111111111111";
        //TODO: watcher permit hash should compute later
        const watcherPermitHash = "0088eb2b6745ad637112b50a4c5e389881f910ebcf802b183d6633083c2b04fc";

        const guardNFTUint = strToUint8Array(guardNFT);
        const RSNTokenUint = strToUint8Array(RSNToken);

        const script = RwtRepoScript
            .replace("GUARD_NFT", Buffer.from(guardNFTUint).toString('base64'))
            .replace("RSN_TOKEN", Buffer.from(RSNTokenUint).toString('base64'))
            .replace("PERMIT_SCRIPT_HASH", watcherPermitHash);

        const api = new ErgoNetwork();
        const res = await api.pay2ScriptAddress(script);
        // console.log("watcher repo address is ", res);
        const P2SA = ergoLib.Address.from_base58(res);
        return P2SA;

    }
}
