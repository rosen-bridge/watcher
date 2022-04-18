import { expect } from "chai";
import { Scanner } from "../../src/scanner/scanner";
import { firstObservations, loadDataBase } from "./models";

describe("Scanner test", async () => {
    const DB = await loadDataBase("scanner");
    
    describe("isForkHappen", () => {
        it("fork doesn't happened", async () => {
            await DB.changeLastValidBlock(3433333);
            await DB.saveBlock(
                3433333,
                "26197be6579e09c7edec903239866fbe7ff6aee2e4ed4031c64d242e9dd1bff6",
                firstObservations
            );
            const scanner = new Scanner(DB);
            expect(await scanner.isForkHappen()).to.equal(false);
        });

        it("fork happened", async () => {
            await DB.changeLastValidBlock(3433333);
            await DB.saveBlock(
                3433333,
                "e1699582bd2e3426839e10f7f5066bafc6e3847fd4511a2013ba3b4e13514267",
                firstObservations
            );
            const scanner = new Scanner(DB);
            expect(await scanner.isForkHappen()).to.be.true;
        });
    });
});
