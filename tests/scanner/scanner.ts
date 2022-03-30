import { instance, mock, when } from "ts-mockito";
import { expect } from "chai";
import DataBase from "../../src/scanner/models";
import { Scanner } from "../../src/scanner/scanner";

describe("Scanner test", () => {
    describe("isForkHappen", () => {
        const mockDataBase = mock(DataBase);
        it("fork doesn't happened", async () => {
            when(mockDataBase.getLastSavedBlock()).thenReturn(new Promise((resolve, reject) => {
                    setTimeout(() => {
                        resolve({
                            "hash": "26197be6579e09c7edec903239866fbe7ff6aee2e4ed4031c64d242e9dd1bff6",
                            "block_height": 3433333
                        });
                    }, 20);
                })
            );
            const DB=instance(mockDataBase);
            const scanner = new Scanner(DB);
            expect(await scanner.isForkHappen()).to.equal(false);
        });

        it("fork happened", async () => {
            when(mockDataBase.getLastSavedBlock()).thenReturn(new Promise((resolve, reject) => {
                    setTimeout(() => {
                        resolve({
                            "hash": "e1699582bd2e3426839e10f7f5066bafc6e3847fd4511a2013ba3b4e13514267",
                            "block_height": 3433333
                        });
                    }, 20);
                })
            );
            const DB=instance(mockDataBase);
            const scanner = new Scanner(DB);
            expect(await scanner.isForkHappen()).to.equal(true);
        });
    });
});
