import { anyString, mock, spy, when } from "ts-mockito";
import { CardanoUtils } from "../../src/scanner/utils";
import { expect } from "chai";
import DataBase from "../../src/scanner/models";
import { Scanner } from "../../src/scanner/scanner";


describe("Scanner test", () => {
    describe("isForkHappen", () => {
        const mockDataBase = mock(DataBase);
        when(mockDataBase.getLastSavedBlock()).thenReturn(new Promise((resolve, reject) => {
                setTimeout(() => {
                    resolve({
                        "hash": "26197be6579e09c7edec903239866fbe7ff6aee2e4ed4031c64d242e9dd1bff6",
                        "block_height": 3433333
                    });
                }, 300);
            })
        );
        const scanner = new Scanner(mockDataBase);
        //TODO:should completed later according to TX interface
        it("fork doesn't happen", async () => {
            expect(await scanner.isForkHappen()).to.equal(false);
        });
    });
});
