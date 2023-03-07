import { MigrationInterface, QueryRunner } from 'typeorm';

export class watcherModelMigration1678171462407 implements MigrationInterface {
  name = 'watcherModelMigration1678171462407';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "temporary_tx_entity" (
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
                "type" varchar CHECK("type" IN ('commitment', 'trigger')) NOT NULL,
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
  }
}
