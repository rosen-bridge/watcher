import { MigrationInterface, QueryRunner } from 'typeorm';

export class watcherModelMigration1683891492000 implements MigrationInterface {
  name = 'watcherModelMigration1683891492000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "temporary_tx_entity" (
                "id" integer PRIMARY KEY NOT NULL,
                "creationTime" integer NOT NULL,
                "updateBlock" integer NOT NULL,
                "type" varchar CHECK("type" IN ('commitment', 'trigger', 'detach', 'redeem')) NOT NULL,
                "txId" varchar NOT NULL,
                "txSerialized" varchar NOT NULL,
                "deleted" boolean NOT NULL,
                "observationId" integer,
                CONSTRAINT "FK_b5b6231b330927b9625ef8560de" FOREIGN KEY ("observationId") REFERENCES "observation_entity" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_tx_entity"(
                    "id",
                    "creationTime",
                    "updateBlock",
                    "type",
                    "txId",
                    "txSerialized",
                    "deleted",
                    "observationId"
                )
            SELECT "id",
                "creationTime",
                "updateBlock",
                "type",
                "txId",
                "txSerialized",
                "deleted",
                "observationId"
            FROM "tx_entity"
        `);
    await queryRunner.query(`
            DROP TABLE "tx_entity"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_tx_entity"
                RENAME TO "tx_entity"
        `);
    await queryRunner.query(`
            CREATE TABLE "temporary_observation_status_entity" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "status" varchar CHECK("status" IN ('0', '1', '2', '3', '4', '5', '6', '7')) NOT NULL,
                "observationId" integer,
                CONSTRAINT "REL_0a64720aa46fb4fd199a0285df" UNIQUE ("observationId"),
                CONSTRAINT "FK_0a64720aa46fb4fd199a0285df2" FOREIGN KEY ("observationId") REFERENCES "observation_entity" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_observation_status_entity"(
                    "id",
                    "status",
                    "observationId"
                )
            SELECT "id",
                "status",
                "observationId"
            FROM "observation_status_entity"
        `);
    await queryRunner.query(`
            DROP TABLE "observation_status_entity"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_observation_status_entity"
                RENAME TO "observation_status_entity"
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "tx_entity"
                RENAME TO "temporary_tx_entity"
        `);
    await queryRunner.query(`
            CREATE TABLE "tx_entity" (
                "id" integer PRIMARY KEY NOT NULL,
                "creationTime" integer NOT NULL,
                "updateBlock" integer NOT NULL,
                "type" varchar CHECK("type" IN ('commitment', 'trigger', 'detach')) NOT NULL,
                "txId" varchar NOT NULL,
                "txSerialized" varchar NOT NULL,
                "deleted" boolean NOT NULL,
                "observationId" integer,
                CONSTRAINT "FK_b5b6231b330927b9625ef8560de" FOREIGN KEY ("observationId") REFERENCES "observation_entity" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
            )
        `);
    await queryRunner.query(`
            INSERT INTO "tx_entity"(
                    "id",
                    "creationTime",
                    "updateBlock",
                    "type",
                    "txId",
                    "txSerialized",
                    "deleted",
                    "observationId"
                )
            SELECT "id",
                "creationTime",
                "updateBlock",
                "type",
                "txId",
                "txSerialized",
                "deleted",
                "observationId"
            FROM "temporary_tx_entity"
        `);
    await queryRunner.query(`
            DROP TABLE "temporary_tx_entity"
        `);
    await queryRunner.query(`
            ALTER TABLE "observation_status_entity"
                RENAME TO "temporary_observation_status_entity"
        `);
    await queryRunner.query(`
            CREATE TABLE "temporary_observation_status_entity" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "status" varchar CHECK("status" IN ('0', '1', '2', '3', '4', '5')) NOT NULL,
                "observationId" integer,
                CONSTRAINT "REL_0a64720aa46fb4fd199a0285df" UNIQUE ("observationId"),
                CONSTRAINT "FK_0a64720aa46fb4fd199a0285df2" FOREIGN KEY ("observationId") REFERENCES "observation_entity" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_observation_status_entity"(
                    "id",
                    "status",
                    "observationId"
                )
            SELECT "id",
                "status",
                "observationId"
            FROM "observation_status_entity"
        `);
    await queryRunner.query(`
            DROP TABLE "temporary_observation_status_entity"
        `);
  }
}
