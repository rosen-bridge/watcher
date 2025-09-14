import {
  MigrationInterface,
  QueryRunner,
} from '@rosen-bridge/extended-typeorm';

export class WatcherMigration1720425345411 implements MigrationInterface {
  name = 'WatcherMigration1720425345411';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "temporary_tx_entity" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "creationTime" integer NOT NULL,
                "updateBlock" integer NOT NULL,
                "type" varchar CHECK(
                    "type" IN (
                        'commitment',
                        'trigger',
                        'detach',
                        'redeem',
                        'permit',
                        'reward'
                    )
                ) NOT NULL,
                "txId" varchar NOT NULL,
                "txSerialized" varchar NOT NULL,
                "deleted" boolean NOT NULL,
                "isValid" boolean NOT NULL DEFAULT (1),
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
                    "isValid",
                    "observationId"
                )
            SELECT "id",
                "creationTime",
                "updateBlock",
                "type",
                "txId",
                "txSerialized",
                "deleted",
                "isValid",
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
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "creationTime" integer NOT NULL,
                "updateBlock" integer NOT NULL,
                "type" varchar CHECK(
                    "type" IN (
                        'commitment',
                        'trigger',
                        'detach',
                        'redeem',
                        'permit'
                    )
                ) NOT NULL,
                "txId" varchar NOT NULL,
                "txSerialized" varchar NOT NULL,
                "deleted" boolean NOT NULL,
                "isValid" boolean NOT NULL DEFAULT (1),
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
                    "isValid",
                    "observationId"
                )
            SELECT "id",
                "creationTime",
                "updateBlock",
                "type",
                "txId",
                "txSerialized",
                "deleted",
                "isValid",
                "observationId"
            FROM "temporary_tx_entity"
        `);
    await queryRunner.query(`
            DROP TABLE "temporary_tx_entity"
        `);
  }
}
