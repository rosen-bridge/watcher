import { MigrationInterface, QueryRunner } from "typeorm";

export class networkModelMigration1660498187921 implements MigrationInterface {
    name = 'networkModelMigration1660498187921'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "block_entity" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "height" integer NOT NULL, "hash" varchar(64) NOT NULL, "parentHash" varchar(64) NOT NULL, "status" varchar NOT NULL, "scanner" varchar NOT NULL, CONSTRAINT "UQ_7e20625b11840edf7f120565c3d" UNIQUE ("parentHash", "scanner"), CONSTRAINT "UQ_b1e24c5950a7c3dd48d92bbfbb2" UNIQUE ("hash", "scanner"), CONSTRAINT "UQ_521d830047d5fe08988538289dd" UNIQUE ("height", "scanner"))`);
        await queryRunner.query(`CREATE TABLE "commitment_entity" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "extractor" varchar NOT NULL, "eventId" varchar NOT NULL, "commitment" varchar NOT NULL, "WID" varchar NOT NULL, "commitmentBoxId" varchar NOT NULL, "blockId" varchar NOT NULL, "height" integer NOT NULL, "spendBlockHash" varchar, "spendBlockHeight" integer)`);
        await queryRunner.query(`CREATE TABLE "event_trigger_entity" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "extractor" varchar NOT NULL, "boxId" varchar NOT NULL, "boxSerialized" varchar NOT NULL, "blockId" varchar NOT NULL, "height" integer NOT NULL, "fromChain" varchar NOT NULL, "toChain" varchar NOT NULL, "fromAddress" varchar NOT NULL, "toAddress" varchar NOT NULL, "amount" varchar NOT NULL, "bridgeFee" varchar NOT NULL, "networkFee" varchar NOT NULL, "sourceChainTokenId" varchar NOT NULL, "targetChainTokenId" varchar NOT NULL, "sourceTxId" varchar NOT NULL, "sourceBlockId" varchar NOT NULL, "WIDs" varchar NOT NULL)`);
        await queryRunner.query(`CREATE TABLE "permit_entity" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "extractor" varchar NOT NULL, "boxId" varchar NOT NULL, "boxSerialized" varchar NOT NULL, "WID" varchar NOT NULL, "blockId" varchar NOT NULL, "height" integer NOT NULL, "spendBlockHash" varchar, "spendBlockHeight" integer)`);
        await queryRunner.query(`CREATE TABLE "observation_entity" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "fromChain" varchar(30) NOT NULL, "toChain" varchar(30) NOT NULL, "fromAddress" varchar NOT NULL, "toAddress" varchar NOT NULL, "height" integer NOT NULL, "amount" varchar NOT NULL, "networkFee" varchar NOT NULL, "bridgeFee" varchar NOT NULL, "sourceChainTokenId" varchar NOT NULL, "targetChainTokenId" varchar NOT NULL, "sourceTxId" varchar NOT NULL, "sourceBlockId" varchar NOT NULL, "requestId" varchar NOT NULL, "block" varchar NOT NULL, "status" varchar CHECK( "status" IN ('0','1','2','3','4','5') ) NOT NULL, "extractor" varchar NOT NULL, CONSTRAINT "UQ_f0af4ab9dd56c983ce8a83adcbf" UNIQUE ("requestId"))`);
        await queryRunner.query(`CREATE TABLE "box_entity" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "address" varchar NOT NULL, "boxId" varchar NOT NULL, "createBlock" varchar NOT NULL, "creationHeight" integer NOT NULL, "serialized" varchar NOT NULL, "spendBlock" text, "extractor" varchar NOT NULL)`);
        await queryRunner.query(`CREATE TABLE "tx_entity" ("id" integer PRIMARY KEY NOT NULL, "creationTime" integer NOT NULL, "updateBlock" integer NOT NULL, "type" varchar CHECK( "type" IN ('commitment','trigger') ) NOT NULL, "txId" varchar NOT NULL, "txSerialized" varchar NOT NULL, "deleted" boolean NOT NULL, "observationId" integer)`);
        await queryRunner.query(`CREATE TABLE "temporary_tx_entity" ("id" integer PRIMARY KEY NOT NULL, "creationTime" integer NOT NULL, "updateBlock" integer NOT NULL, "type" varchar CHECK( "type" IN ('commitment','trigger') ) NOT NULL, "txId" varchar NOT NULL, "txSerialized" varchar NOT NULL, "deleted" boolean NOT NULL, "observationId" integer, CONSTRAINT "FK_b5b6231b330927b9625ef8560de" FOREIGN KEY ("observationId") REFERENCES "observation_entity" ("requestId") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_tx_entity"("id", "creationTime", "updateBlock", "type", "txId", "txSerialized", "deleted", "observationId") SELECT "id", "creationTime", "updateBlock", "type", "txId", "txSerialized", "deleted", "observationId" FROM "tx_entity"`);
        await queryRunner.query(`DROP TABLE "tx_entity"`);
        await queryRunner.query(`ALTER TABLE "temporary_tx_entity" RENAME TO "tx_entity"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tx_entity" RENAME TO "temporary_tx_entity"`);
        await queryRunner.query(`CREATE TABLE "tx_entity" ("id" integer PRIMARY KEY NOT NULL, "creationTime" integer NOT NULL, "updateBlock" integer NOT NULL, "type" varchar CHECK( "type" IN ('commitment','trigger') ) NOT NULL, "txId" varchar NOT NULL, "txSerialized" varchar NOT NULL, "deleted" boolean NOT NULL, "observationId" integer)`);
        await queryRunner.query(`INSERT INTO "tx_entity"("id", "creationTime", "updateBlock", "type", "txId", "txSerialized", "deleted", "observationId") SELECT "id", "creationTime", "updateBlock", "type", "txId", "txSerialized", "deleted", "observationId" FROM "temporary_tx_entity"`);
        await queryRunner.query(`DROP TABLE "temporary_tx_entity"`);
        await queryRunner.query(`DROP TABLE "tx_entity"`);
        await queryRunner.query(`DROP TABLE "box_entity"`);
        await queryRunner.query(`DROP TABLE "observation_entity"`);
        await queryRunner.query(`DROP TABLE "permit_entity"`);
        await queryRunner.query(`DROP TABLE "event_trigger_entity"`);
        await queryRunner.query(`DROP TABLE "commitment_entity"`);
        await queryRunner.query(`DROP TABLE "block_entity"`);
    }

}
