import DataBase from "../../src/scanner/models";
import { expect } from "chai";
import { WatcherDataSource } from "../../src/models/WatcherDataSource";

describe("Database functions", () => {
    const database = new DataBase(WatcherDataSource);
    // describe("getBlockAtHeight", () => {
    //     it("Blocks has and heights should be equal", async () => {
    //         const sample = await database.getBlockAtHeight(3408015);
    //         expect(sample.block_height).to.equal(3408015)
    //     });
    // })
});
