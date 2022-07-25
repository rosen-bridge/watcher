import { MigrationInterface, QueryRunner } from "typeorm";

export class bridgeModelMigration1657372167634 implements MigrationInterface {
    name = 'bridgeModelMigration1657372167634'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "bridge_block_entity" (
                    "height" integer PRIMARY KEY NOT NULL, 
                    "hash" varchar(64) NOT NULL, 
                    CONSTRAINT "UQ_704f5c9eafd1fcabc287feb19cc" UNIQUE ("hash")
                 )`
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
                    CONSTRAINT "FK_cbd976955f2cce93fda0069865e" FOREIGN KEY ("blockHeight") REFERENCES "bridge_block_entity" ("height") ON DELETE CASCADE ON UPDATE NO ACTION, 
                    CONSTRAINT "FK_443356c00a735cbccb805f893d0" FOREIGN KEY ("spendBlockHeight") REFERENCES "bridge_block_entity" ("height") ON DELETE SET NULL ON UPDATE NO ACTION
                )`
        );
        await queryRunner.query(
            `CREATE TABLE "observed_commitment_entity" (
                    "id" integer PRIMARY KEY NOT NULL, 
                    "eventId" varchar NOT NULL, 
                    "commitment" varchar NOT NULL, 
                    "WID" varchar NOT NULL, 
                    "commitmentBoxId" varchar NOT NULL, 
                    "spendReason" varchar, 
                    "blockHeight" integer, 
                    "spendBlockHeight" integer, 
                    CONSTRAINT "FK_500f90c61fb27327ee25350c33b" FOREIGN KEY ("blockHeight") REFERENCES "bridge_block_entity" ("height") ON DELETE CASCADE ON UPDATE NO ACTION, 
                    CONSTRAINT "FK_e43db92f2466f82759cec509625" FOREIGN KEY ("spendBlockHeight") REFERENCES "bridge_block_entity" ("height") ON DELETE SET NULL ON UPDATE NO ACTION
                )`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "observed_commitment_entity"`);
        await queryRunner.query(`DROP TABLE "bridge_block_entity"`);
        await queryRunner.query(`DROP TABLE "box_entity"`);
    }

}
