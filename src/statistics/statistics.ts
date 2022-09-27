import { Config } from "../config/config";
import { ErgoNetwork } from "../ergo/network/ergoNetwork";
import { WatcherDataBase } from "../database/models/watcherModel";
import { watcherTransaction } from "../index";
import { base64ToArrayBuffer } from "../utils/utils";
import * as wasm from "ergo-lib-wasm-nodejs";

const config = Config.getConfig();

class Statistics{
    private static instance: Statistics;
    private readonly watcherAddress = config.address;
    private readonly ergoNetwork = ErgoNetwork;
    private readonly database: WatcherDataBase;
    watcherWID: string | undefined;
    //TODO:should fixed later
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    private constructor(watcherDB: WatcherDataBase) {
        this.database = watcherDB;
        this.watcherWID=watcherTransaction.watcherWID
    }

    static getInstance = (watcherDB: WatcherDataBase) => {
        if (!Statistics.instance) {
            Statistics.instance = new Statistics(watcherDB);
        }
        return Statistics.instance;
    }

    getWID = ()=>{
        this.watcherWID=watcherTransaction.watcherWID;
    }

    getErgs = async (): Promise<string> => {
        const balance = await this.ergoNetwork.getBalanceConfirmed(this.watcherAddress);
        return balance.nanoErgs.toString();
    }

    getBalance = async ()=>{
        const permits=await this.database.getPermitBoxesByWID('')
        let ergs=0n
        const tokens:{[tokenId:string]:bigint}={}
        permits.forEach((permit)=> {
            const box=wasm.ErgoBox.sigma_parse_bytes(base64ToArrayBuffer(permit.boxSerialized));
            ergs+= BigInt(box.value().as_i64().to_str())
            for(let i=0;i<box.tokens().len();i++){
                const token=box.tokens().get(i);
                const tokenId=token.id().to_str();
                const amount=BigInt(token.amount().as_i64().to_str())
                if(!Object.hasOwnProperty.call(tokens,tokenId)){
                    tokens[tokenId]=amount
                }else{
                    tokens[tokenId]+=amount
                }
            }

        })
        return {ergs:ergs,tokens:tokens}
    }


    getCommitmentsCount = async () => {
        return await this.database.commitmentsByWIDCount("")
    }

    getEventTriggersCount = async () => {
        return await this.database.eventTriggersByWIDCount('')
    }

    getCommitments = async (offset = 0, limit = 10) => {
        const commitments = await this.database.commitmentByWID('', offset, limit)
        return commitments.map((commitment) => {
            return {
                eventId: commitment.eventId,
                boxId: commitment.boxId,
                block: commitment.block,
                height: commitment.height,
                spendBlock: commitment.spendBlock,
                spendHeight: commitment.spendHeight
            }
        })
    }

    getEventTriggers = async (offset = 0, limit = 10) => {
        const eventTriggers = await this.database.eventTriggersByWID('', offset, limit)
        return eventTriggers.map((event) => {
            return {
                boxId: event.boxId,
                block: event.block,
                height: event.height,
                fromChain: event.fromChain,
                toChain: event.toChain,
                fromAddress: event.fromAddress,
                toAddress: event.toAddress,
                amount: event.amount,
                bridgeFee: event.bridgeFee,
                networkFee: event.networkFee,
                sourceChainTokenId: event.sourceChainTokenId,
                targetChainTokenId: event.targetChainTokenId,
                sourceTxId: event.sourceTxId,
                sourceBlockId: event.sourceBlockId,
                // spendBlock:event.spendBlock,
                // spendHeight:event.spendHeight,
            }
        })
    }

}


export default Statistics
