import { BridgeDataBase } from "../../src/database/models/bridgeModel";
import { DataSource, Repository } from "typeorm";
import { CommitmentEntity, EventTriggerEntity, PermitEntity } from "@rosen-bridge/watcher-data-extractor";
import { describe } from "mocha";
import { expect } from "chai";
import {
    commitmentEntity, eventTriggerEntity, fakePlainBox, fakeWIDBox, newEventTriggerEntity,
    permitEntity, plainBox,
    spentCommitmentEntity,
    spentPermitEntity, spentPlainBox, spentWIDBox, WIDBox
} from "./mockedData";
import { BoxEntity } from "@rosen-bridge/address-extractor";

let commitmentRepo: Repository<CommitmentEntity>
let permitRepo: Repository<PermitEntity>
let boxRepo: Repository<BoxEntity>
let eventTriggerRepo: Repository<EventTriggerEntity>

export const loadBridgeDataBase = async (name: string): Promise<BridgeDataBase> => {
    const ormConfig = new DataSource({
        type: "sqlite",
        database: `./sqlite/watcher-test-${name}.sqlite`,
        entities: [
            'src/database/entities/watcher/*.ts',
            'node_modules/@rosen-bridge/scanner/dist/entities/*.js',
            'node_modules/@rosen-bridge/watcher-data-extractor/dist/entities/*.js',
            'node_modules/@rosen-bridge/observation-extractor/dist/entities/*.js',
            'node_modules/@rosen-bridge/address-extractor/dist/entities/*.js'
        ],
        migrations: ['src/database/migrations/watcher/*.ts'],
        synchronize: false,
        logging: false,
    });
    await ormConfig.initialize()
    await ormConfig.runMigrations()
    commitmentRepo = ormConfig.getRepository(CommitmentEntity)
    permitRepo = ormConfig.getRepository(PermitEntity)
    boxRepo = ormConfig.getRepository(BoxEntity)
    eventTriggerRepo = ormConfig.getRepository(EventTriggerEntity)
    return new BridgeDataBase(ormConfig);
}

describe("BridgeDatabase tests", () => {
    before("", async () => {
        const DB = await loadBridgeDataBase("bridge");
        await commitmentRepo.save([commitmentEntity, spentCommitmentEntity])
        await permitRepo.save([permitEntity, spentPermitEntity])
        await boxRepo.save([plainBox, spentPlainBox, fakePlainBox, WIDBox, spentWIDBox, fakeWIDBox])
        await eventTriggerRepo.save([eventTriggerEntity, newEventTriggerEntity])
    })

    describe("getOldSpentCommitments", () => {
        it("should return an old commitment", async() => {
            const DB = await loadBridgeDataBase("bridge");
            const data = await DB.getOldSpentCommitments(3433335)
            expect(data).to.have.length(1)
        })
    })

    describe("commitmentsByEventId", () => {
        it("should return two commitments with specified event id", async () => {
            const DB = await loadBridgeDataBase("bridge");
            const data = await DB.commitmentsByEventId("eventId")
            expect(data).to.have.length(2)
        })
    })

    describe("findCommitmentsById", () => {
        it("should return exactly two commitments with the specified box id", async () => {
            const DB = await loadBridgeDataBase("bridge");
            const data = await DB.findCommitmentsById([commitmentEntity.commitmentBoxId, spentCommitmentEntity.commitmentBoxId])
            expect(data).to.have.length(2)
            expect(data[0]).to.eql(commitmentEntity)
            expect(data[1]).to.eql(spentCommitmentEntity)
        })
    })

    describe("deleteCommitments", () => {
        it("should delete two commitments with specified ids", async() => {
            const DB = await loadBridgeDataBase("bridge");
            await DB.deleteCommitments([commitmentEntity.commitmentBoxId, spentCommitmentEntity.commitmentBoxId])
            const data = await DB.getOldSpentCommitments(3433335)
            expect(data).to.have.length(0)
        })
    })

    describe("getUnspentPermitBoxes", () => {
        it("should find one unspent permit box", async() => {
            const DB = await loadBridgeDataBase("bridge");
            const data = await DB.getUnspentPermitBoxes()
            expect(data).to.have.length(1)
            expect(data[0]).to.eql(permitEntity)
        })
    })

    describe("getUnspentPlainBoxes", () => {
        it("should find one unspent plain box", async() => {
            const DB = await loadBridgeDataBase("bridge");
            const data = await DB.getUnspentPlainBoxes()
            expect(data).to.have.length(1)
            expect(data[0]).to.eql(plainBox)
        })
    })

    describe("eventTriggerBySourceTxId", () => {
        it("should find one unspent WID box", async() => {
            const DB = await loadBridgeDataBase("bridge");
            const data = await DB.eventTriggerBySourceTxId(eventTriggerEntity.sourceTxId)
            expect(data).to.eql(eventTriggerEntity)
        })
    })
})

