import { MigrationInterface, QueryRunner } from "typeorm";

export class commitmentModelMigration1655486422332 implements MigrationInterface {
    name = 'commitmentModelMigration1655486422332'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "box_entity" ("id" integer PRIMARY KEY NOT NULL, "boxId" varchar NOT NULL, "value" bigint NOT NULL, "type" varchar CHECK( "type" IN ('permit','wid','plain') ) NOT NULL, "boxJson" varchar NOT NULL, "blockHeight" integer, "spendBlockHeight" integer)`);
        await queryRunner.query(`CREATE TABLE "c_block_entity" ("height" integer PRIMARY KEY NOT NULL, "hash" varchar(64) NOT NULL, CONSTRAINT "UQ_8e2c9d96cb48b7ef0a4c1c80474" UNIQUE ("hash"))`);
        await queryRunner.query(
            `CREATE TABLE "observed_commitment_entity" (
                        "id" integer PRIMARY KEY NOT NULL, 
                        "eventId" varchar NOT NULL, "commitment" varchar NOT NULL, 
                        "WID" varchar NOT NULL, "commitmentBoxId" varchar NOT NULL, 
                        "eventTriggerBoxId" varchar, "blockHeight" integer, 
                        "spendBlockHeight" integer,
                        CONSTRAINT "FK_500f90c61fb27327ee25350c33b" FOREIGN KEY ("blockHeight") REFERENCES "c_block_entity" ("height") ON DELETE CASCADE ON UPDATE NO ACTION, 
                        CONSTRAINT "FK_e43db92f2466f82759cec509625" FOREIGN KEY ("spendBlockHeight") REFERENCES "c_block_entity" ("height") ON DELETE SET NULL ON UPDATE NO ACTION)`
        );
        await queryRunner.query(
            `CREATE TABLE "box_entity" (
                        "id" integer PRIMARY KEY NOT NULL, 
                        "boxId" varchar NOT NULL, 
                        "value" bigint NOT NULL, 
                        "type" varchar CHECK( "type" IN ('permit','wid','plain') ) NOT NULL, 
                        "boxJson" varchar NOT NULL, 
                        "blockHeight" integer, 
                        "spendBlockHeight" integer,
                        CONSTRAINT "FK_cbd976955f2cce93fda0069865e" FOREIGN KEY ("blockHeight") REFERENCES "c_block_entity" ("height") ON DELETE CASCADE ON UPDATE NO ACTION,
                        CONSTRAINT "FK_443356c00a735cbccb805f893d0" FOREIGN KEY ("spendBlockHeight") REFERENCES "c_block_entity" ("height") ON DELETE SET NULL ON UPDATE NO ACTION)`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "temporary_box_entity"`);
        await queryRunner.query(`DROP TABLE "temporary_observed_commitment_entity"`);
        await queryRunner.query(`DROP TABLE "c_block_entity"`);
        await queryRunner.query(`DROP TABLE "box_entity"`);
        await queryRunner.query(`DROP TABLE "observed_commitment_entity"`);
    }

}
