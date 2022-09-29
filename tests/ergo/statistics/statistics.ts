import { WatcherDataBase } from "../../../src/database/models/watcherModel";

import { loadDataBase } from "../../database/watcherDatabase";
import Statistics from "../../../src/statistics/statistics";

import { expect } from "chai";

let statistics:Statistics;

describe('Statistics',()=>{
    let DB: WatcherDataBase

    before("inserting into database",async ()=>{
        DB = await loadDataBase("Statistics")
        statistics = Statistics.getInstance(DB, 'WIDStatistics');
        // await commitmentRepo.save([commitmentEntity, spentCommitmentEntity,firstStatisticCommitment,secondStatisticCommitment,thirdStatisticCommitment])

    })
    describe('getErgsAndFee',()=>{
        it('',async ()=>{
            const ergsAndTokens=await statistics.getErgsAndFee();
            expect(ergsAndTokens.ergs).to.equal(98900000n);
            expect(ergsAndTokens.tokens).to.eql( {
                '3c6cb596273a737c3e111c31d3ec868b84676b7bad82f9888ad574b44edef267': 11n,
                '0034c44f0c7a38f833190d44125ff9b3a0dd9dbb89138160182a930bc521db95': 10n
            });
        })
    })

    describe('getCommitmentsCount',()=>{
        it('',async ()=>{

            expect(await statistics.getCommitmentsCount()).to.equal(3)
        })
    })

    describe('getEventTriggersCount',()=>{
        it('',async ()=>{
            expect(await statistics.getEventTriggersCount()).to.equal(3)

        })
    })

    describe('getCommitments',()=>{
        it('',async () =>{
            expect(await statistics.getCommitments(0,1)).to.eql([
                    {
                        eventId: 'eventId1',
                        boxId: 'boxIdStatistics1',
                        block: 'block',
                        height: 1005,
                        spendBlock: null,
                        spendHeight: null
                    }
                ]
            )
        })

        it('',async () =>{
            expect(await statistics.getCommitments(1,2)).to.eql([
                    {
                        eventId: 'eventId2',
                        boxId: 'boxIdStatistics2',
                        block: 'block',
                        height: 1005,
                        spendBlock: null,
                        spendHeight: null
                    },
                    {
                        eventId: 'eventId3',
                        boxId: 'boxIdStatistics3',
                        block: 'block',
                        height: 1005,
                        spendBlock: null,
                        spendHeight: null
                    }
                ]
            )
        })

    })

    describe("getEventTriggers", ()=>{
        it('',async () =>{
            expect(await statistics.getEventTriggers(0,1)).to.eql([
                    {
                        boxId: 'boxId',
                        block: 'blockID',
                        height: 100,
                        fromChain: 'fromChain',
                        toChain: 'toChain',
                        fromAddress: 'fromAddress',
                        toAddress: 'toAddress',
                        amount: '100',
                        bridgeFee: '200',
                        networkFee: '1000',
                        sourceChainTokenId: 'tokenId',
                        targetChainTokenId: 'targetTokenId',
                        sourceTxId: 'txId',
                        sourceBlockId: 'block'
                    }
                ]
            )
        })

        it('',async () =>{
            expect(await statistics.getEventTriggers(1,2)).to.eql([
                    {
                        boxId: 'boxId2',
                        block: 'blockID2',
                        height: 100,
                        fromChain: 'fromChain',
                        toChain: 'toChain',
                        fromAddress: 'fromAddress',
                        toAddress: 'toAddress',
                        amount: '100',
                        bridgeFee: '200',
                        networkFee: '1000',
                        sourceChainTokenId: 'tokenId',
                        targetChainTokenId: 'targetTokenId',
                        sourceTxId: 'txId2',
                        sourceBlockId: 'block'
                    },
                    {
                        boxId: 'boxIdStatistics',
                        block: 'blockID',
                        height: 100,
                        fromChain: 'fromChain',
                        toChain: 'toChain',
                        fromAddress: 'fromAddress',
                        toAddress: 'toAddress',
                        amount: '100',
                        bridgeFee: '200',
                        networkFee: '1000',
                        sourceChainTokenId: 'tokenId',
                        targetChainTokenId: 'targetTokenId',
                        sourceTxId: 'txId',
                        sourceBlockId: 'block'
                    }
                ]
            )
        })

    })

})

