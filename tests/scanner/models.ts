import DataBase from "../../src/scanner/models";
import { expect } from "chai";

describe("Database functions", () => {
    const database = new DataBase();
    describe("getBlockAtHeight", () => {
        it("Blocks has and heights should be equal", async () => {
            const sample = await database.getBlockAtHeight(3408015);
            expect(sample.block_height).to.equal(3408015)
        });
    })
});
