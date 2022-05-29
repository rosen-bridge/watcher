import { rosenConfig } from "../../../src/api/rosenConfig";
import { Transaction } from "../../../src/api/Transaction";
import { strToUint8Array } from "../../../src/utils/utils";
import { expect } from "chai";
import * as ergoLib from "ergo-lib-wasm-nodejs";
import { findSourceMap } from "module";
import exp from "constants";
import MockAdapter from "axios-mock-adapter";
import { explorerApi, nodeClient } from "../../../src/ergo/network/ergoNetwork";



const mockedExplorer = new MockAdapter(explorerApi);
const mockedNodeClient = new MockAdapter(nodeClient);

mockedExplorer.onGet(
    '/api/v1/boxes/unspent/byErgoTree/0008cd03c29ad59831be2e5baded45a03ce9a7d4c2e83d683e11c79790e76f640d0d3e30',
    {params: {offset: '0', limit: '1'}}
).reply(200, [
    {
        "items": [
            {
                "boxId": "3ac7e967200368b6a95f0714d24f830161fb0d5c7c173beae316969687ba98af",
                "transactionId": "dc84702d37d98367149572e1e01361c66e1b4f531ea7e0813b510e3fec91fbeb",
                "blockId": "0918e0d916d547902cf67ddab4020d12690ca558252871dd6f5c150dcd8dad2a",
                "value": 100000,
                "index": 2,
                "globalIndex": 469394,
                "creationHeight": 214337,
                "settlementHeight": 214339,
                "ergoTree": "0008cd03c29ad59831be2e5baded45a03ce9a7d4c2e83d683e11c79790e76f640d0d3e30",
                "address": "9hwWcMhrebk4Ew5pBpXaCJ7zuH8eYkY9gRfLjNP3UeBYNDShGCT",
                "assets": [
                    {
                        "tokenId": "4911d8b1e96bccba5cbbfe2938578b3b58a795156518959fcbfc3bd7232b35a8",
                        "index": 0,
                        "amount": 1,
                        "name": null,
                        "decimals": null,
                        "type": null
                    }
                ],
                "additionalRegisters": {},
                "spentTransactionId": null,
                "mainChain": true
            }
        ],
        "total": 4
    }
]);

mockedExplorer.onGet(
    '/api/v1/boxes/unspent/byErgoTree/0008cd03c29ad59831be2e5baded45a03ce9a7d4c2e83d683e11c79790e76f640d0d3e30',
    {params: {offset: '0', limit: '10'}}
).reply(200, [
    {
        "items": [
            {
                "boxId": "3ac7e967200368b6a95f0714d24f830161fb0d5c7c173beae316969687ba98af",
                "transactionId": "dc84702d37d98367149572e1e01361c66e1b4f531ea7e0813b510e3fec91fbeb",
                "blockId": "0918e0d916d547902cf67ddab4020d12690ca558252871dd6f5c150dcd8dad2a",
                "value": 100000,
                "index": 2,
                "globalIndex": 469394,
                "creationHeight": 214337,
                "settlementHeight": 214339,
                "ergoTree": "0008cd03c29ad59831be2e5baded45a03ce9a7d4c2e83d683e11c79790e76f640d0d3e30",
                "address": "9hwWcMhrebk4Ew5pBpXaCJ7zuH8eYkY9gRfLjNP3UeBYNDShGCT",
                "assets": [
                    {
                        "tokenId": "4911d8b1e96bccba5cbbfe2938578b3b58a795156518959fcbfc3bd7232b35a8",
                        "index": 0,
                        "amount": 1,
                        "name": null,
                        "decimals": null,
                        "type": null
                    }
                ],
                "additionalRegisters": {},
                "spentTransactionId": null,
                "mainChain": true
            },
            {
                "boxId": "762a25c986e4cc2dfbad6e092b214307ab88de9a073d01e80c17a81efab6d98b",
                "transactionId": "e841baa12e63bdf30f72c789b0ec2f6c4af382aaa47749a00d963a8a7d7bc243",
                "blockId": "7cc00b6bcf22346f376005a60120409468b104b7044c851048e29dd07452e606",
                "value": 94500000,
                "index": 1,
                "globalIndex": 464579,
                "creationHeight": 211940,
                "settlementHeight": 211942,
                "ergoTree": "0008cd03c29ad59831be2e5baded45a03ce9a7d4c2e83d683e11c79790e76f640d0d3e30",
                "address": "9hwWcMhrebk4Ew5pBpXaCJ7zuH8eYkY9gRfLjNP3UeBYNDShGCT",
                "assets": [
                    {
                        "tokenId": "a2a6c892c38d508a659caf857dbe29da4343371e597efd42e40f9bc99099a516",
                        "index": 0,
                        "amount": 100,
                        "name": "RSN",
                        "decimals": 0,
                        "type": "EIP-004"
                    },
                    {
                        "tokenId": "bc01703067be4e0effc54f742a6c62ef6edc289e49df3c2e08ada204fb1e14c3",
                        "index": 1,
                        "amount": 1,
                        "name": null,
                        "decimals": null,
                        "type": null
                    }
                ],
                "additionalRegisters": {},
                "spentTransactionId": null,
                "mainChain": true
            },
            {
                "boxId": "61b4f0080f8af2046a26fbaeca3e7404075b9b2ae4d74d07920abac09a6a766b",
                "transactionId": "1dd5df72468937e6e277bdd74d265919457c8c7b320053c7d503dcdf1bf67343",
                "blockId": "e0e906cc014e89448432b632f0c65720048c5240d5b8d0a61af050887a05885e",
                "value": 10000000,
                "index": 0,
                "globalIndex": 446913,
                "creationHeight": 203158,
                "settlementHeight": 203160,
                "ergoTree": "0008cd03c29ad59831be2e5baded45a03ce9a7d4c2e83d683e11c79790e76f640d0d3e30",
                "address": "9hwWcMhrebk4Ew5pBpXaCJ7zuH8eYkY9gRfLjNP3UeBYNDShGCT",
                "assets": [
                    {
                        "tokenId": "34a217f1d2bc0f84607dad61c886de53f1ca919c389f184136f05a0de1d196f2",
                        "index": 0,
                        "amount": 100,
                        "name": "testt",
                        "decimals": 0,
                        "type": "EIP-004"
                    }
                ],
                "additionalRegisters": {},
                "spentTransactionId": null,
                "mainChain": true
            },
            {
                "boxId": "18bb8ff0fdb2c005405ddee776e08303f6a129495e2a0e68969fe5e25844a689",
                "transactionId": "fa8be159e331ba1e94e4a7facd8b4ab84a53b3512df30b836ba5c81cb299f167",
                "blockId": "4ee00ea11d241afc4f032dddad50ee953974d67d870e314058e20e16f365e5ed",
                "value": 10000000,
                "index": 0,
                "globalIndex": 446867,
                "creationHeight": 203142,
                "settlementHeight": 203144,
                "ergoTree": "0008cd03c29ad59831be2e5baded45a03ce9a7d4c2e83d683e11c79790e76f640d0d3e30",
                "address": "9hwWcMhrebk4Ew5pBpXaCJ7zuH8eYkY9gRfLjNP3UeBYNDShGCT",
                "assets": [
                    {
                        "tokenId": "2c966d5840c8725aff53414b3e60f494d4f1b79e642c9ef806e6536ec32f77f9",
                        "index": 0,
                        "amount": 100,
                        "name": "myt",
                        "decimals": 1000,
                        "type": "EIP-004"
                    }
                ],
                "additionalRegisters": {},
                "spentTransactionId": null,
                "mainChain": true
            }
        ],
        "total": 4
    }
]);




describe("Watcher Permit Transactions", () => {

    describe("createPermitBox", () => {

        it("checks box data", async () => {
            const transaction = new Transaction(
                rosenConfig,
                "9hwWcMhrebk4Ew5pBpXaCJ7zuH8eYkY9gRfLjNP3UeBYNDShGCT",
                "7c390866f06156c5c67b355dac77b6f42eaffeb30e739e65eac2c7e27e6ce1e2"
            );
            const WID = strToUint8Array("4198da878b927fdd33e884d7ed399a3dbd22cf9d855ff5a103a50301e70d89fc");
            const RWTCount = "100";
            const permitBox = await transaction.createPermitBox(
                1,
                RWTCount,
                WID
            );

            expect(permitBox.value().as_i64().to_str()).to.be.equal(rosenConfig.minBoxValue);
            expect(permitBox.tokens().len()).to.be.equal(1);
            expect(permitBox.tokens().get(0).amount().as_i64().to_str()).to.be.equal(RWTCount);
            expect(permitBox.tokens().get(0).id().to_str()).to.be.equal(rosenConfig.RWTId);
            expect(permitBox.register_value(4)?.to_coll_coll_byte().length).to.be.equal(1);
            expect(permitBox.register_value(4)?.to_coll_coll_byte()[0]).to.be.eql(WID);
            expect(permitBox.register_value(5)?.to_byte_array()).to.be.eql(new Uint8Array([0]));

        });
    });

    describe("createUserBoxCandidate", () => {
        it("checks box data", async () => {
            const transaction = new Transaction(
                rosenConfig,
                "9hwWcMhrebk4Ew5pBpXaCJ7zuH8eYkY9gRfLjNP3UeBYNDShGCT",
                "7c390866f06156c5c67b355dac77b6f42eaffeb30e739e65eac2c7e27e6ce1e2"
            );
            const tokensId = [
                "4198da878b927fdd33e884d7ed399a3dbd22cf9d855ff5a103a50301e70d89fc",
                "00ac861f0a121f86691ad3d0e928604e3dc77c1f37e71099218dcb162667911b",
                "002b4ebc5e0eb147fa95a0c10cc9e44d0e6464fd51864be5ae4f1b86174b465d",
                "00419c7bdd23e71c14f6ff1e1180a5899a7be0e13f6aa6000cb2eeb514930df7"
            ];
            const tokensAmount = ["100", "1", "8000", "999000"];
            const amount = "11111111111"
            const tokenId = tokensId[0];
            const tokenAmount = tokensAmount[0];
            const changeTokens = new Map<string, string>();
            for (let i = 1; i < 4; i++) {
                changeTokens.set(tokensId[i], tokensAmount[i]);
            }

            const userBoxCandidate = await transaction.createUserBoxCandidate(
                1,
                "",
                amount,
                ergoLib.TokenId.from_str(tokenId),
                ergoLib.TokenAmount.from_i64(ergoLib.I64.from_str(tokenAmount)),
                changeTokens,
            );

            expect(userBoxCandidate.value().as_i64().to_str()).to.be.equal(amount);
            expect(userBoxCandidate.tokens().len()).to.be.equal(4);
            let boxTokensId: Array<string> = [];
            let boxTokensAmount: Array<string> = [];
            for (let i = 0; i < 4; i++) {
                boxTokensId.push(userBoxCandidate.tokens().get(i).id().to_str());
                boxTokensAmount.push(userBoxCandidate.tokens().get(i).amount().as_i64().to_str());
            }
            expect(boxTokensId).to.be.eql(tokensId);
            expect(boxTokensAmount).to.be.eql(boxTokensAmount);
        });
    });

    describe("checkWID", () => {
        it("should be true in the array", () => {
            const transaction = new Transaction(
                rosenConfig,
                "9hwWcMhrebk4Ew5pBpXaCJ7zuH8eYkY9gRfLjNP3UeBYNDShGCT",
                "7c390866f06156c5c67b355dac77b6f42eaffeb30e739e65eac2c7e27e6ce1e2"
            );
            const usersHex = ["414441", "4911d8b1e96bccba5cbbfe2938578b3b58a795156518959fcbfc3bd7232b35a8"];
            let users: Array<Uint8Array> = [];
            for (let user of usersHex) {
                users.push(strToUint8Array(user));
            }
            const checks = Promise.all(transaction.checkWID(users)).then(res => console.log(res));
            console.log(checks)
            explorerApi.get('/api/v1/boxes/unspent/byErgoTree/0008cd03c29ad59831be2e5baded45a03ce9a7d4c2e83d683e11c79790e76f640d0d3e30',
                 {params: {offset: '0', limit: '1'}}).then(res => console.log(res));
        });
    });

});
