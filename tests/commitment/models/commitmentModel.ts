import {DataSource} from "typeorm";
import {commitmentEntities} from "../../../src/entities";
import {commitmentMigrations} from "../../../src/migrations";
import {CommitmentDataBase} from "../../../src/commitments/models/commitmentModel";
import {Commitment} from "../../../src/objects/interfaces";
import {expect} from "chai";

const loadDataBase = async (name: string): Promise<CommitmentDataBase> => {
    const ormConfig = new DataSource({
        type: "sqlite",
        database: `./sqlite/watcher-test-${name}.sqlite`,
        entities: commitmentEntities,
        synchronize: true,
        // migrations: commitmentMigrations,
        logging: false,
    });
    return await CommitmentDataBase.init(ormConfig);
}

const firstCommitment: Commitment = {
    WID: "f875d3b916e56056968d02018133d1c122764d5c70538e70e56199f431e95e9b",
    commitment: "c0666e24aa83e38b3955aae906140bda7f2e1974aca897c28962e7eaebd84026",
    eventId: "ab59962c20f57d9d59e95f5170ccb3472df4279ad4967e51ba8be9ba75144c7b",
    commitmentBoxId: "1ab9da11fc216660e974842cc3b7705e62ebb9e0bf5ff78e53f9cd40abadd117"
};

const secondCommitment: Commitment = {
    WID: "ecbde212e49df0e8f65dbaba5f59a6760a8f4c58a3d3451bad68b72ee3588703",
    commitment: "45891bf7173066ada6f83dc1bfcf2bf0c53ad90f5e4a5778781c82ad68f822e1",
    eventId: "2f4a12a39d3c925c0776131eded109e8430d958cd3cd0fcff13c73f49c57085f",
    commitmentBoxId: "43d0ead059054f29ca9c831c93613e1ca98e8fbbc8b166c4fa24120a9d489824"
};


describe("Commitment Database functions", async () => {
    const DB = await loadDataBase("commitments");

    describe("commitment saveBlock", () => {
        it("should store the new commitment", async () => {
            let res = await DB.saveBlock(
                3433333,
                "26197be6579e09c7edec903239866fbe7ff6aee2e4ed4031c64d242e9dd1bff6",
                {
                    newCommitments: [firstCommitment],
                    updatedCommitments: []
                }
            );
            expect(res).to.be.true;
        });
        it("should store the new commitment and update the existing one", async () => {
            let res = await DB.saveBlock(
                3433334,
                "3ab9da11fc216660e974842cc3b7705e62ebb9e0bf5ff78e53f9cd40abadd117",
                {
                    newCommitments: [secondCommitment],
                    updatedCommitments: ["1ab9da11fc216660e974842cc3b7705e62ebb9e0bf5ff78e53f9cd40abadd117"]
                }
            );
            expect(res).to.be.true;
        });
    });

    describe("getBlockAtHeight", () => {
        it("should return a block", async() => {
            let data = await DB.getBlockAtHeight(3433333)
            expect(data).to.haveOwnProperty("hash")
            expect(data).to.haveOwnProperty("block_height")
            expect(data?.block_height).to.eql(3433333);
        })
    })


})

