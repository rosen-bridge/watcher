import { DataSource } from "typeorm";
import { commitmentEntities } from "../../../src/entities";
import { BridgeDataBase } from "../../../src/bridge/models/bridgeModel";
import { Commitment, SpecialBox } from "../../../src/objects/interfaces";
import { expect } from "chai";
import { BoxType } from "../../../src/entities/watcher/bridge/BoxEntity";

export const loadDataBase = async (name: string): Promise<BridgeDataBase> => {
    const ormConfig = new DataSource({
        type: "sqlite",
        database: `./sqlite/watcher-test-${name}.sqlite`,
        entities: commitmentEntities,
        synchronize: true,
        logging: false,
    });
    return await BridgeDataBase.init(ormConfig);
}

export const firstCommitment: Commitment = {
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

const thirdCommitment: Commitment = {
    WID: "ecbde212e49df0e8f65dbaba5f59a6760a8f4c58a3d3451bad68b72ee3588703",
    commitment: "f0fc04ceea089b372c6e312f974be9be0ec8a9fa3568a0a6c155cb7d535186c7",
    eventId: "ab59962c20f57d9d59e95f5170ccb3472df4279ad4967e51ba8be9ba75144c7b",
    commitmentBoxId: "a18dc1f812aa156037c47db5bd7fc9ef85646c97a1abb76b30045b8e5f7e31e2"
}

const firstPermitBox: SpecialBox = {
    boxId: "cea4dacf032e7e152ea0a5029fe6a84d685d22f42f7137ef2735ce90663192d7",
    type: BoxType.PERMIT,
    value: "10000000",
    boxJson: "fakeSample"
}

const secondPermitBox: SpecialBox = {
    boxId: "6ba81a7de39dce3303d100516bf80228e8c03464c130d5b0f8ff6f78f66bcbc8",
    type: BoxType.PERMIT,
    value: "10000000",
    boxJson: "fakeSample"
}

const firstWIDBox: SpecialBox ={
    boxId: "cd0e9ad2ae564768bc6bf74a350934117040686fd267f313fce27d7df00fe549",
    type: BoxType.WID,
    value: "100000000",
    boxJson: "fakeSample"
}

const secondWIDBox: SpecialBox ={
    boxId: "2e24776266d16afbf23e7c96ba9c2ffb9bce25ea75d3ed9f2a9a3b2c84bf1655",
    type: BoxType.WID,
    value: "10000000",
    boxJson: "fakeSample"
}


describe("Commitment Database functions", () => {

    describe("commitment saveBlock", () => {
        it("should store the new commitment", async () => {
            const DB = await loadDataBase("commitments");
            const res = await DB.saveBlock(
                3433333,
                "26197be6579e09c7edec903239866fbe7ff6aee2e4ed4031c64d242e9dd1bff6",
                {
                    newCommitments: [firstCommitment],
                    updatedCommitments: [],
                    newBoxes: [firstPermitBox, firstWIDBox],
                    spentBoxes: []
                }
            );
            expect(res).to.be.true;
        });
        it("should store the new commitment and update the existing one", async () => {
            const DB = await loadDataBase("commitments");
            const res = await DB.saveBlock(
                3433334,
                "3ab9da11fc216660e974842cc3b7705e62ebb9e0bf5ff78e53f9cd40abadd117",
                {
                    newCommitments: [secondCommitment, thirdCommitment],
                    updatedCommitments: ["1ab9da11fc216660e974842cc3b7705e62ebb9e0bf5ff78e53f9cd40abadd117"],
                    newBoxes: [secondPermitBox, secondWIDBox],
                    spentBoxes: [firstPermitBox.boxId, firstWIDBox.boxId]
                }
            );
            expect(res).to.be.true;
        });
    });

    describe("getBlockAtHeight", () => {
        it("should return a block", async() => {
            const DB = await loadDataBase("commitments");
            const data = await DB.getBlockAtHeight(3433333)
            expect(data).to.haveOwnProperty("hash")
            expect(data).to.haveOwnProperty("block_height")
            expect(data?.block_height).to.eql(3433333);
        })
    })

    describe("getOldSpentCommitments", () => {
        it("should return an old commitment", async() => {
            const DB = await loadDataBase("commitments");
            const data = await DB.getOldSpentCommitments(3433335)
            expect(data).to.have.length(1)
        })
    })

    describe("commitmentsByEventId", () => {
        it("should return a commitment with specified event id", async () => {
            const DB = await loadDataBase("commitments");
            const data = await DB.commitmentsByEventId(firstCommitment.eventId)
            expect(data).to.have.length(2)
        })
    })

    describe("findCommitmentsById", () => {
        it("should return exactly two bridge with the specified id", async () => {
            const DB = await loadDataBase("commitments");
            const data  = await DB.findCommitmentsById([secondCommitment.commitmentBoxId, thirdCommitment.commitmentBoxId])
            expect(data).to.have.length(2)
            expect(data[0].commitment).to.eql(secondCommitment.commitment)
        })
    })

    describe("deleteCommitments", () => {
        it("should delete two bridge", async() => {
            const DB = await loadDataBase("commitments");
            await DB.deleteCommitments([firstCommitment.commitmentBoxId, secondCommitment.commitmentBoxId])
            const data = await DB.getOldSpentCommitments(3433335)
            expect(data).to.have.length(0)
        })
    })

    describe("getUnspentSpecialBoxes", () => {
        it("should return one unspent permit box", async() => {
            const DB = await loadDataBase("commitments");
            const data = await DB.getUnspentSpecialBoxes(BoxType.PERMIT)
            expect(data).to.have.length(1)
        })
        it("should return one unspent WID box", async() => {
            const DB = await loadDataBase("commitments");
            const data = await DB.getUnspentSpecialBoxes(BoxType.WID)
            expect(data).to.have.length(1)
        })
    })

    describe("findUnspentSpecialBoxesById", () => {
        it("should return two unspent special boxes by id", async() => {
            const DB = await loadDataBase("commitments");
            const data = await DB.findUnspentSpecialBoxesById([secondWIDBox.boxId, secondPermitBox.boxId])
            expect(data).to.have.length(2)
        })
    })
})

