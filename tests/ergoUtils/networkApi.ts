import { expect } from "chai";
import { ErgoNetworkApi, nodeApi } from "../../src/ergoUtils/networkApi";
import { describe } from "mocha";
import MockAdapter from "axios-mock-adapter";

import lastBlockHeaders from "./dataset/lastBlockHeaders.json"

const mockedAxios = new MockAdapter(nodeApi);

mockedAxios.onGet(`/blocks/lastHeaders/10`)
    .reply(200, lastBlockHeaders)

describe("Testing ergo network api", () => {
    describe("getLastBlockHeader", () => {
        it("Should return 10 blockHeader", async () => {
            const data = await ErgoNetworkApi.getLastBlockHeader();
            expect(data).to.have.length(10)
        });
    });
})
