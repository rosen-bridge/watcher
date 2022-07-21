import { MigrationInterface, QueryRunner } from "typeorm";

export class networkModelMigration1658414485911 implements MigrationInterface {
    name = 'networkModelMigration1658414485911'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "block_entity" ("height" integer PRIMARY KEY NOT NULL, "hash" varchar(64) NOT NULL, CONSTRAINT "UQ_57845dc6f88ffe08c94ea1a6aba" UNIQUE ("hash"))`);
        await queryRunner.query(`CREATE TABLE "observation_entity" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "fromChain" varchar(30) NOT NULL, "toChain" varchar(30) NOT NULL, "fromAddress" varchar NOT NULL, "toAddress" varchar NOT NULL, "amount" varchar NOT NULL, "networkFee" varchar NOT NULL, "bridgeFee" varchar NOT NULL, "sourceChainTokenId" varchar NOT NULL, "targetChainTokenId" varchar NOT NULL, "sourceTxId" varchar NOT NULL, "sourceBlockId" varchar NOT NULL, "requestId" varchar NOT NULL, "status" varchar CHECK( "status" IN ('0','1','2','3','4','5') ) NOT NULL, "blockHeight" integer, CONSTRAINT "UQ_f0af4ab9dd56c983ce8a83adcbf" UNIQUE ("requestId"))`);
        await queryRunner.query(`CREATE TABLE "tx_entity" ("id" integer PRIMARY KEY NOT NULL, "creationTime" integer NOT NULL, "updateBlock" integer NOT NULL, "type" varchar CHECK( "type" IN ('commitment','trigger') ) NOT NULL, "txId" varchar NOT NULL, "txSerialized" varchar NOT NULL, "deleted" boolean NOT NULL, "observationId" integer)`);
        await queryRunner.query(`CREATE TABLE "temporary_observation_entity" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "fromChain" varchar(30) NOT NULL, "toChain" varchar(30) NOT NULL, "fromAddress" varchar NOT NULL, "toAddress" varchar NOT NULL, "amount" varchar NOT NULL, "networkFee" varchar NOT NULL, "bridgeFee" varchar NOT NULL, "sourceChainTokenId" varchar NOT NULL, "targetChainTokenId" varchar NOT NULL, "sourceTxId" varchar NOT NULL, "sourceBlockId" varchar NOT NULL, "requestId" varchar NOT NULL, "status" varchar CHECK( "status" IN ('0','1','2','3','4','5') ) NOT NULL, "blockHeight" integer, CONSTRAINT "UQ_f0af4ab9dd56c983ce8a83adcbf" UNIQUE ("requestId"), CONSTRAINT "FK_c1c9e3913095e63b4ab32304aa7" FOREIGN KEY ("blockHeight") REFERENCES "block_entity" ("height") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_observation_entity"("id", "fromChain", "toChain", "fromAddress", "toAddress", "amount", "networkFee", "bridgeFee", "sourceChainTokenId", "targetChainTokenId", "sourceTxId", "sourceBlockId", "requestId", "status", "blockHeight") SELECT "id", "fromChain", "toChain", "fromAddress", "toAddress", "amount", "networkFee", "bridgeFee", "sourceChainTokenId", "targetChainTokenId", "sourceTxId", "sourceBlockId", "requestId", "status", "blockHeight" FROM "observation_entity"`);
        await queryRunner.query(`DROP TABLE "observation_entity"`);
        await queryRunner.query(`ALTER TABLE "temporary_observation_entity" RENAME TO "observation_entity"`);
        await queryRunner.query(`CREATE TABLE "temporary_tx_entity" ("id" integer PRIMARY KEY NOT NULL, "creationTime" integer NOT NULL, "updateBlock" integer NOT NULL, "type" varchar CHECK( "type" IN ('commitment','trigger') ) NOT NULL, "txId" varchar NOT NULL, "txSerialized" varchar NOT NULL, "deleted" boolean NOT NULL, "observationId" integer, CONSTRAINT "FK_b5b6231b330927b9625ef8560de" FOREIGN KEY ("observationId") REFERENCES "observation_entity" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_tx_entity"("id", "creationTime", "updateBlock", "type", "txId", "txSerialized", "deleted", "observationId") SELECT "id", "creationTime", "updateBlock", "type", "txId", "txSerialized", "deleted", "observationId" FROM "tx_entity"`);
        await queryRunner.query(`DROP TABLE "tx_entity"`);
        await queryRunner.query(`ALTER TABLE "temporary_tx_entity" RENAME TO "tx_entity"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tx_entity" RENAME TO "temporary_tx_entity"`);
        await queryRunner.query(`CREATE TABLE "tx_entity" ("id" integer PRIMARY KEY NOT NULL, "creationTime" integer NOT NULL, "updateBlock" integer NOT NULL, "type" varchar CHECK( "type" IN ('commitment','trigger') ) NOT NULL, "txId" varchar NOT NULL, "txSerialized" varchar NOT NULL, "deleted" boolean NOT NULL, "observationId" integer)`);
        await queryRunner.query(`INSERT INTO "tx_entity"("id", "creationTime", "updateBlock", "type", "txId", "txSerialized", "deleted", "observationId") SELECT "id", "creationTime", "updateBlock", "type", "txId", "txSerialized", "deleted", "observationId" FROM "temporary_tx_entity"`);
        await queryRunner.query(`DROP TABLE "temporary_tx_entity"`);
        await queryRunner.query(`ALTER TABLE "observation_entity" RENAME TO "temporary_observation_entity"`);
        await queryRunner.query(`CREATE TABLE "observation_entity" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "fromChain" varchar(30) NOT NULL, "toChain" varchar(30) NOT NULL, "fromAddress" varchar NOT NULL, "toAddress" varchar NOT NULL, "amount" varchar NOT NULL, "networkFee" varchar NOT NULL, "bridgeFee" varchar NOT NULL, "sourceChainTokenId" varchar NOT NULL, "targetChainTokenId" varchar NOT NULL, "sourceTxId" varchar NOT NULL, "sourceBlockId" varchar NOT NULL, "requestId" varchar NOT NULL, "status" varchar CHECK( "status" IN ('0','1','2','3','4','5') ) NOT NULL, "blockHeight" integer, CONSTRAINT "UQ_f0af4ab9dd56c983ce8a83adcbf" UNIQUE ("requestId"))`);
        await queryRunner.query(`INSERT INTO "observation_entity"("id", "fromChain", "toChain", "fromAddress", "toAddress", "amount", "networkFee", "bridgeFee", "sourceChainTokenId", "targetChainTokenId", "sourceTxId", "sourceBlockId", "requestId", "status", "blockHeight") SELECT "id", "fromChain", "toChain", "fromAddress", "toAddress", "amount", "networkFee", "bridgeFee", "sourceChainTokenId", "targetChainTokenId", "sourceTxId", "sourceBlockId", "requestId", "status", "blockHeight" FROM "temporary_observation_entity"`);
        await queryRunner.query(`DROP TABLE "temporary_observation_entity"`);
        await queryRunner.query(`DROP TABLE "tx_entity"`);
        await queryRunner.query(`DROP TABLE "observation_entity"`);
        await queryRunner.query(`DROP TABLE "block_entity"`);
    }

}
