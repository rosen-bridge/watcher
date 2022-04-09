import { MigrationInterface, QueryRunner } from "typeorm";

export class migration1649504270511 implements MigrationInterface {
    name = 'migration1649504270511'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "observation_entity" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "fromChain" varchar(30) NOT NULL, "toChain" varchar(30) NOT NULL, "toAddress" varchar NOT NULL, "amount" varchar NOT NULL, "fee" varchar NOT NULL, "sourceChainTokenId" varchar NOT NULL, "targetChainTokenId" varchar NOT NULL, "sourceTxId" varchar NOT NULL, "sourceBlockId" varchar NOT NULL, "requestId" varchar NOT NULL, "blockHeight" integer)`);
        await queryRunner.query(`CREATE TABLE "block_entity" ("height" integer PRIMARY KEY NOT NULL, "hash" varchar(64) NOT NULL)`);
        await queryRunner.query(`CREATE TABLE "commitment_entity" ("id" integer PRIMARY KEY NOT NULL, "eventId" varchar NOT NULL, "commitment" varchar NOT NULL, "UTP" varchar NOT NULL, "commitmentBoxId" varchar NOT NULL)`);
        await queryRunner.query(`CREATE TABLE "temporary_observation_entity" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "fromChain" varchar(30) NOT NULL, "toChain" varchar(30) NOT NULL, "toAddress" varchar NOT NULL, "amount" varchar NOT NULL, "fee" varchar NOT NULL, "sourceChainTokenId" varchar NOT NULL, "targetChainTokenId" varchar NOT NULL, "sourceTxId" varchar NOT NULL, "sourceBlockId" varchar NOT NULL, "requestId" varchar NOT NULL, "blockHeight" integer, CONSTRAINT "FK_c1c9e3913095e63b4ab32304aa7" FOREIGN KEY ("blockHeight") REFERENCES "block_entity" ("height") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_observation_entity"("id", "fromChain", "toChain", "toAddress", "amount", "fee", "sourceChainTokenId", "targetChainTokenId", "sourceTxId", "sourceBlockId", "requestId", "blockHeight") SELECT "id", "fromChain", "toChain", "toAddress", "amount", "fee", "sourceChainTokenId", "targetChainTokenId", "sourceTxId", "sourceBlockId", "requestId", "blockHeight" FROM "observation_entity"`);
        await queryRunner.query(`DROP TABLE "observation_entity"`);
        await queryRunner.query(`ALTER TABLE "temporary_observation_entity" RENAME TO "observation_entity"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "observation_entity" RENAME TO "temporary_observation_entity"`);
        await queryRunner.query(`CREATE TABLE "observation_entity" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "fromChain" varchar(30) NOT NULL, "toChain" varchar(30) NOT NULL, "toAddress" varchar NOT NULL, "amount" varchar NOT NULL, "fee" varchar NOT NULL, "sourceChainTokenId" varchar NOT NULL, "targetChainTokenId" varchar NOT NULL, "sourceTxId" varchar NOT NULL, "sourceBlockId" varchar NOT NULL, "requestId" varchar NOT NULL, "blockHeight" integer)`);
        await queryRunner.query(`INSERT INTO "observation_entity"("id", "fromChain", "toChain", "toAddress", "amount", "fee", "sourceChainTokenId", "targetChainTokenId", "sourceTxId", "sourceBlockId", "requestId", "blockHeight") SELECT "id", "fromChain", "toChain", "toAddress", "amount", "fee", "sourceChainTokenId", "targetChainTokenId", "sourceTxId", "sourceBlockId", "requestId", "blockHeight" FROM "temporary_observation_entity"`);
        await queryRunner.query(`DROP TABLE "temporary_observation_entity"`);
        await queryRunner.query(`DROP TABLE "commitment_entity"`);
        await queryRunner.query(`DROP TABLE "block_entity"`);
        await queryRunner.query(`DROP TABLE "observation_entity"`);
    }

}
