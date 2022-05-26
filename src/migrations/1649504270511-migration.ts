import { MigrationInterface, QueryRunner } from "typeorm";

export class migration1649504270511 implements MigrationInterface {
    name = 'migration1649504270511'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "block_entity" ("height" integer PRIMARY KEY NOT NULL, "hash" varchar(64) NOT NULL, CONSTRAINT "UQ_57845dc6f88ffe08c94ea1a6aba" UNIQUE ("hash"))`);
        await queryRunner.query(`CREATE TABLE "commitment_entity" ("id" integer PRIMARY KEY NOT NULL, "eventId" varchar NOT NULL, "commitment" varchar NOT NULL, "UTP" varchar NOT NULL, "commitmentBoxId" varchar NOT NULL)`);
        await queryRunner.query(`CREATE TABLE "observation_entity" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "fromChain" varchar(30) NOT NULL, "toChain" varchar(30) NOT NULL, "fromAddress" varchar NOT NULL, "toAddress" varchar NOT NULL, "amount" varchar NOT NULL, "fee" varchar NOT NULL, "sourceChainTokenId" varchar NOT NULL, "targetChainTokenId" varchar NOT NULL, "sourceTxId" varchar NOT NULL, "sourceBlockId" varchar NOT NULL, "requestId" varchar NOT NULL, "blockHeight" integer, CONSTRAINT "UQ_f0af4ab9dd56c983ce8a83adcbf" UNIQUE ("requestId"), CONSTRAINT "FK_c1c9e3913095e63b4ab32304aa7" FOREIGN KEY ("blockHeight") REFERENCES "block_entity" ("height") ON DELETE CASCADE ON UPDATE NO ACTION)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "commitment_entity"`);
        await queryRunner.query(`DROP TABLE "block_entity"`);
        await queryRunner.query(`DROP TABLE "observation_entity"`);
    }

}
