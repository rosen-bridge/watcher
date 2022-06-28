import { expect } from "chai";
import { Scanner } from "../../../src/cardano/scanner/scanner";
import { firstObservations, loadDataBase } from "../models/models";
import { KoiosNetwork } from "../../../src/cardano/network/koios";
import config from "config";

describe("Scanner test", () => {
    describe("isForkHappen", () => {
        it("fork doesn't happened", async () => {
            const DB = await loadDataBase("scanner");
            await DB.removeForkedBlocks(3433333);
            await DB.saveBlock(
                3433333,
                "26197be6579e09c7edec903239866fbe7ff6aee2e4ed4031c64d242e9dd1bff6",
                firstObservations
            );
            const koiosNetwork = new KoiosNetwork();
            const scanner = new Scanner(DB, koiosNetwork, config);
            expect(await scanner.isForkHappen()).to.equal(false);
        });

        it("fork happened", async () => {
            const DB = await loadDataBase("scanner");
            await DB.removeForkedBlocks(3433333);
            await DB.saveBlock(
                3433333,
                "e1699582bd2e3426839e10f7f5066bafc6e3847fd4511a2013ba3b4e13514267",
                firstObservations
            );
            const koiosNetwork = new KoiosNetwork();
            const scanner = new Scanner(DB, koiosNetwork, config);
            expect(await scanner.isForkHappen()).to.be.true;
        });

        it("is undefined", async () => {
            const DB = await loadDataBase("scanner-empty");
            const koiosNetwork = new KoiosNetwork();
            const scanner = new Scanner(DB, koiosNetwork, config);
            expect(await scanner.isForkHappen()).to.be.false;
        });

    });
    describe("update", () => {
        it("scanner without fork", async () => {
            const DB = await loadDataBase("scanner-without-fork");
            await DB.removeForkedBlocks(3433333);
            await DB.saveBlock(
                3433333,
                "26197be6579e09c7edec903239866fbe7ff6aee2e4ed4031c64d242e9dd1bff6",
                firstObservations
            );
            const koiosNetwork = new KoiosNetwork();
            const scanner = new Scanner(DB, koiosNetwork, config);
            await scanner.update();
            const lastBlock = await DB.getLastSavedBlock();
            expect(lastBlock?.block_height).to.be.equal(3433333);
        });
        it("scanner with fork", async () => {
            const DB = await loadDataBase("scanner-with-fork");
            await DB.removeForkedBlocks(3433333);
            await DB.saveBlock(
                3433333,
                "397e969e0525d82dc46a33e31634187dae94b12a6cc4b534e4e52f6d313aef22",
                firstObservations
            );
            const koiosNetwork = new KoiosNetwork();
            const scanner = new Scanner(DB, koiosNetwork, config);
            await scanner.update();
            const lastBlock = await DB.getLastSavedBlock();
            expect(lastBlock).to.be.undefined;
        });
    })
});
