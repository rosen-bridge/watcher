import { getBlockAtHeight } from "../../src/scanner/models";
import { expect } from "chai";

describe("Database functions", () => {
    describe("getBlockAtHeight", () => {
        it("Blocks has and heights should be equal", async () => {
            const sample = await getBlockAtHeight(3408015);
            expect(sample.block_height).to.equal(3408015)
        });
    })
});
