import { ErgoNetwork } from "../../../src/ergo/network/ergoNetwork";
import { mockedResponseBody } from "../objects/mockedResponseBody";
import { expect } from "chai";
import { JsonBI } from "../../../src/network/parser";
import { RWTRepoAddress, userAddress } from "../transactions/permit";
import * as wasm from "ergo-lib-wasm-nodejs";

describe("Ergo Network(API)", () => {
    const ergoNetwork = new ErgoNetwork();
    describe("pay2ScriptAddress", () => {
        it("should returns p2sa", async () => {
            const res = await ergoNetwork.pay2ScriptAddress(mockedResponseBody.fraudScript);
            expect(res).to.be.equal(mockedResponseBody.fraudP2SAddress.address);
        });
    });

    describe("getHeight", () => {
        it("should return last block height", async () => {
            const res = await ergoNetwork.getHeight();
            expect(res).to.equal(215809);
        });
    });

    describe("getBoxesForAddress", () => {
        it("should return `AddressBoxes` instance offset=0", async () => {
            const res = await ergoNetwork.getBoxesForAddress(
                "0008cd03c880d703131f301badf289ceb9b7f86d674e8cbe390461f66e844f507571a1d6",
                0,
                1
            );
            expect(res).to.eql(
                JsonBI.parse(
                    mockedResponseBody.firstWatcherLastUnspentBox
                )
            );
        });

        it("should return `AddressBoxes` instance offset=1", async () => {
            const res = await ergoNetwork.getBoxesForAddress(
                "0008cd03c880d703131f301badf289ceb9b7f86d674e8cbe390461f66e844f507571a1d6",
                1,
                1
            );
            expect(res).to.eql(
                JsonBI.parse(
                    mockedResponseBody.emptyAddressBox
                )
            );
        });
    });

    describe("getBoxesByAddress", () => {
        it("should return array of ErgoBoxes", async () => {
            const res = await ergoNetwork.getBoxesByAddress("9hwWcMhrebk4Ew5pBpXaCJ7zuH8eYkY9gRfLjNP3UeBYNDShGCT");
            expect(res.len().valueOf()).to.be.equal(4);
            expect(res.get(0).box_id().to_str()).to.be.equal("3ac7e967200368b6a95f0714d24f830161fb0d5c7c173beae316969687ba98af");
            expect(res.get(1).box_id().to_str()).to.be.equal("762a25c986e4cc2dfbad6e092b214307ab88de9a073d01e80c17a81efab6d98b");
            expect(res.get(2).box_id().to_str()).to.be.equal("61b4f0080f8af2046a26fbaeca3e7404075b9b2ae4d74d07920abac09a6a766b");
            expect(res.get(3).box_id().to_str()).to.be.equal("18bb8ff0fdb2c005405ddee776e08303f6a129495e2a0e68969fe5e25844a689");

        });
    });

    describe("getLastBlockHeader", () => {
        it("should return last 10 block headers", async () => {
            const res = await ergoNetwork.getLastBlockHeader();
            expect(res).to.be.eql(mockedResponseBody.last10BlockHeaders);
        });
    });

    describe("sendTx", () => {
        it("should return txId", async () => {
            const res = await ergoNetwork.sendTx(mockedResponseBody.sampleTxJson) as { txId: string };
            expect(res.txId).to.be.equal(mockedResponseBody.sampleTxId);
        });
    });

    describe("getErgoStateContext", () => {
        it("should return ErgoStateContext without error", async () => {
            const res = await ergoNetwork.getErgoStateContext();
        });
    });

    describe("getCoveringErgAndTokenForAddress", () => {
        it("test covering erg ", async () => {
            const res = await ergoNetwork.getCoveringErgAndTokenForAddress(
                "0008cd03c29ad59831be2e5baded45a03ce9a7d4c2e83d683e11c79790e76f640d0d3e30",
                BigInt("94500000") + BigInt("10000000"),
            );
            expect(res.covered).to.be.true;
            expect(res.boxes.length).to.be.equal(3);
        });

        it("test covering tokens", async () => {
            const res = await ergoNetwork.getCoveringErgAndTokenForAddress(
                "0008cd03c29ad59831be2e5baded45a03ce9a7d4c2e83d683e11c79790e76f640d0d3e30",
                BigInt("100000"),
                {["a2a6c892c38d508a659caf857dbe29da4343371e597efd42e40f9bc99099a516"]: 100n},
            );
            expect(res.covered).to.be.true;
            expect(res.boxes.length).to.be.equal(2);
        });
    });

    describe("getBoxWithToken", () => {
        it("returns box with NFT in it", async () => {
            const res = await ergoNetwork.getBoxWithToken(
                wasm.Address.from_mainnet_str(userAddress),
                "4911d8b1e96bccba5cbbfe2938578b3b58a795156518959fcbfc3bd7232b35a8"
            );
            expect(res.box_id().to_str()).to.be.equal("3ac7e967200368b6a95f0714d24f830161fb0d5c7c173beae316969687ba98af");
        });
    });

    describe("getErgBox", () => {
        it("get covering Erg without any covering token", async () => {
            const res = await ergoNetwork.getErgBox(
                wasm.Address.from_mainnet_str(userAddress),
                BigInt("20000000"),
            );
            expect(res.length).to.be.equal(2);
        });
    });

    // describe("trackMemPool", () => {
    //     it("should return last box in the mempool", () => {
    //        const res=await ergoNetwork.trackMemPool()
    //     });
    // });

    describe("getMemPoolTxForAddress", () => {
        it("should return mempool transactions", async () => {
            const res = await ergoNetwork.getMemPoolTxForAddress(RWTRepoAddress);
            expect(res.total).to.be.equal(1);
        });
    });

});