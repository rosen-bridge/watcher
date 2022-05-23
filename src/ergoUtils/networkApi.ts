import config from "config";
import axios from "axios";
import SleepPromise from 'sleep-promise';
import * as wasm from "ergo-lib-wasm-nodejs";

const URL: string | undefined = config.get?.('ergo.nodeUrl');
export const nodeApi = axios.create({
    baseURL: URL,
    timeout: 10000
})

export class ErgoNetworkApi {
    static getCurrentHeight = (): Promise<number> => {
        return nodeApi.get<{fullHeight: number}>(`/info`).then(
            res => res.data.fullHeight
        )
    }

    static getLastBlockHeader = () => {
        return nodeApi.get("/blocks/lastHeaders/10").then(
            res => res.data
        )
    }

    static sendTx = (tx: any) => {
        return nodeApi.post("/transactions", JSON.parse(tx)).then(response => ({"txId": response.data as string})).catch(exp => {
            console.log(exp.response.data)
            return SleepPromise(config.get?.('ergo.sendTxTimeout')).then(() => null)
        });
    };

    static getErgoStateContext = async (): Promise<wasm.ErgoStateContext> => {
        const blockHeaderJson = await this.getLastBlockHeader();
        const blockHeaders = wasm.BlockHeaders.from_json(blockHeaderJson);
        const preHeader = wasm.PreHeader.from_block_header(blockHeaders.get(0));
        return new wasm.ErgoStateContext(preHeader, blockHeaders);
    }

    static getTransaction = async (txId: string) => {
        return await nodeApi.get(`/api/v1/transactions/${txId}`).then(res => res.data)
    }

    static pay2ScriptAddress = (script: string): Promise<string> => {
        return nodeApi.post("/script/p2sAddress", {source: script}).then(
            res => res.data.address
        )
    }
}
