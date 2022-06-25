import { MigrationInterface, QueryRunner } from "typeorm";

export class commitmentModelMigration1656074458609 implements MigrationInterface {
    name = 'commitmentModelMigration1656074458609'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "observed_commitment_entity" ("id" integer PRIMARY KEY NOT NULL, "eventId" varchar NOT NULL, "commitment" varchar NOT NULL, "WID" varchar NOT NULL, "commitmentBoxId" varchar NOT NULL, "eventTriggerBoxId" varchar, "blockHeight" integer, "spendBlockHeight" integer)`);
        await queryRunner.query(`CREATE TABLE "c_block_entity" ("height" integer PRIMARY KEY NOT NULL, "hash" varchar(64) NOT NULL, CONSTRAINT "UQ_8e2c9d96cb48b7ef0a4c1c80474" UNIQUE ("hash"))`);
        await queryRunner.query(`CREATE TABLE "temporary_observed_commitment_entity" ("id" integer PRIMARY KEY NOT NULL, "eventId" varchar NOT NULL, "commitment" varchar NOT NULL, "WID" varchar NOT NULL, "commitmentBoxId" varchar NOT NULL, "eventTriggerBoxId" varchar, "blockHeight" integer, "spendBlockHeight" integer, CONSTRAINT "FK_500f90c61fb27327ee25350c33b" FOREIGN KEY ("blockHeight") REFERENCES "c_block_entity" ("height") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_e43db92f2466f82759cec509625" FOREIGN KEY ("spendBlockHeight") REFERENCES "c_block_entity" ("height") ON DELETE SET NULL ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_observed_commitment_entity"("id", "eventId", "commitment", "WID", "commitmentBoxId", "eventTriggerBoxId", "blockHeight", "spendBlockHeight") SELECT "id", "eventId", "commitment", "WID", "commitmentBoxId", "eventTriggerBoxId", "blockHeight", "spendBlockHeight" FROM "observed_commitment_entity"`);
        await queryRunner.query(`DROP TABLE "observed_commitment_entity"`);
        await queryRunner.query(`ALTER TABLE "temporary_observed_commitment_entity" RENAME TO "observed_commitment_entity"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "observed_commitment_entity" RENAME TO "temporary_observed_commitment_entity"`);
        await queryRunner.query(`CREATE TABLE "observed_commitment_entity" ("id" integer PRIMARY KEY NOT NULL, "eventId" varchar NOT NULL, "commitment" varchar NOT NULL, "WID" varchar NOT NULL, "commitmentBoxId" varchar NOT NULL, "eventTriggerBoxId" varchar, "blockHeight" integer, "spendBlockHeight" integer)`);
        await queryRunner.query(`INSERT INTO "observed_commitment_entity"("id", "eventId", "commitment", "WID", "commitmentBoxId", "eventTriggerBoxId", "blockHeight", "spendBlockHeight") SELECT "id", "eventId", "commitment", "WID", "commitmentBoxId", "eventTriggerBoxId", "blockHeight", "spendBlockHeight" FROM "temporary_observed_commitment_entity"`);
        await queryRunner.query(`DROP TABLE "temporary_observed_commitment_entity"`);
        await queryRunner.query(`DROP TABLE "c_block_entity"`);
        await queryRunner.query(`DROP TABLE "observed_commitment_entity"`);
    }

}
