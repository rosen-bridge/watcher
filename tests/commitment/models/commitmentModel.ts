import {DataSource} from "typeorm";
import {commitmentEntities} from "../../../src/entities";
import {migrations} from "../../../src/migrations";
import {CommitmentDataBase} from "../../../src/models/commitmentModel";
import {Commitment} from "../../../src/objects/interfaces";
import {expect} from "chai";

export const loadDataBase = async (name: string): Promise<CommitmentDataBase> => {
    const ormConfig = new DataSource({
        type: "sqlite",
        database: `./sqlite/watcher-test-${name}.sqlite`,
        entities: commitmentEntities,
        synchronize: true,
        migrations: migrations,
        logging: false,
    });
    return await CommitmentDataBase.init(ormConfig);
}

export const firstCommitment: Commitment = {
    WID: "f875d3b916e56056968d02018133d1c122764d5c70538e70e56199f431e95e9b",
    commitment: "c0666e24aa83e38b3955aae906140bda7f2e1974aca897c28962e7eaebd84026",
    eventId: "ab59962c20f57d9d59e95f5170ccb3472df4279ad4967e51ba8be9ba75144c7b",
    commitmentBoxId: ""
};


describe("Commitment Database functions", async () => {
    const DB = await loadDataBase("dataBase");

    describe("commitment saveBlock", () => {
        it("should return true", async () => {
            let res = await DB.saveBlock(
                3433333,
                "26197be6579e09c7edec903239866fbe7ff6aee2e4ed4031c64d242e9dd1bff6",
                [firstCommitment]
            );
            expect(res).to.be.true;
        });
    });
})

