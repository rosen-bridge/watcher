import { MigrationInterface, QueryRunner } from 'typeorm';

export class WatcherMigration1700641198429 implements MigrationInterface {
  name = 'WatcherMigration1700641198429';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "token_entity" (
                "tokenId" varchar PRIMARY KEY NOT NULL,
                "tokenName" varchar NOT NULL,
                "decimals" integer NOT NULL
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "observation_status_entity" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "status" varchar CHECK(
                    "status" IN (
                        'timeout',
                        'not_committed',
                        'commitment_sent',
                        'committed',
                        'reveal_sent',
                        'revealed'
                    )
                ) NOT NULL,
                "observationId" integer,
                CONSTRAINT "REL_0a64720aa46fb4fd199a0285df" UNIQUE ("observationId"),
                CONSTRAINT "FK_0a64720aa46fb4fd199a0285df2" FOREIGN KEY ("observationId") REFERENCES "observation_entity" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
            )
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
            CREATE TABLE "revenue_entity" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "tokenId" varchar NOT NULL,
                "amount" bigint NOT NULL,
                "permitId" integer,
                CONSTRAINT "FK_4f13caf82f774b5d38d406aabb1" FOREIGN KEY ("permitId") REFERENCES "permit_entity" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);
    await queryRunner.query(`
            CREATE VIEW "revenue_view" AS
            SELECT "pe"."id" AS "id",
                "pe"."WID" AS "wid",
                "ete"."sourceChainHeight" AS "lockHeight",
                "be"."height" AS "height",
                "be"."timestamp" AS "timestamp",
                pe."txId" AS "permitTxId",
                ete."eventId" AS "eventId",
                ete."fromChain" AS "fromChain",
                ete."toChain" AS "toChain",
                ete."fromAddress" AS "fromAddress",
                ete."toAddress" AS "toAddress",
                ete."amount" AS "amount",
                ete."bridgeFee" AS "bridgeFee",
                ete."networkFee" AS "networkFee",
                ete."sourceChainTokenId" AS "tokenId",
                ete."sourceTxId" AS "lockTxId"
            FROM "permit_entity" "pe"
                INNER JOIN "event_trigger_entity" "ete" ON pe."txId" = ete."spendTxId"
                LEFT JOIN "block_entity" "be" ON "pe"."block" = "be"."hash"
        `);
    await queryRunner.query(
      `
            INSERT INTO "typeorm_metadata"(
                    "database",
                    "schema",
                    "table",
                    "type",
                    "name",
                    "value"
                )
            VALUES (NULL, NULL, NULL, ?, ?, ?)
        `,
      [
        'VIEW',
        'revenue_view',
        'SELECT "pe"."id" AS "id", "pe"."WID" AS "wid", "ete"."sourceChainHeight" AS "lockHeight", "be"."height" AS "height", "be"."timestamp" AS "timestamp", pe."txId" AS "permitTxId", ete."eventId" AS "eventId", ete."fromChain" AS "fromChain", ete."toChain" AS "toChain", ete."fromAddress" AS "fromAddress", ete."toAddress" AS "toAddress", ete."amount" AS "amount", ete."bridgeFee" AS "bridgeFee", ete."networkFee" AS "networkFee", ete."sourceChainTokenId" AS "tokenId", ete."sourceTxId" AS "lockTxId" FROM "permit_entity" "pe" INNER JOIN "event_trigger_entity" "ete" ON pe."txId" = ete."spendTxId"  LEFT JOIN "block_entity" "be" ON "pe"."block" = "be"."hash"',
      ]
    );
    await queryRunner.query(`
            CREATE VIEW "revenue_chart_data" AS
            SELECT "be"."year" AS "year",
                "be"."month" AS "month",
                "be"."day" AS "day",
                re."tokenId" AS "tokenId",
                re."amount" AS "amount",
                be."timestamp" AS "timestamp"
            FROM "revenue_entity" "re"
                INNER JOIN "permit_entity" "pe" ON re."permitId" = "pe"."id"
                INNER JOIN "block_entity" "be" ON "pe"."block" = "be"."hash"
        `);
    await queryRunner.query(
      `
            INSERT INTO "typeorm_metadata"(
                    "database",
                    "schema",
                    "table",
                    "type",
                    "name",
                    "value"
                )
            VALUES (NULL, NULL, NULL, ?, ?, ?)
        `,
      [
        'VIEW',
        'revenue_chart_data',
        'SELECT "be"."year" AS "year", "be"."month" AS "month", "be"."day" AS "day", re."tokenId" AS "tokenId", re."amount" AS "amount", be."timestamp" AS "timestamp" FROM "revenue_entity" "re" INNER JOIN "permit_entity" "pe" ON re."permitId" = "pe"."id"  INNER JOIN "block_entity" "be" ON "pe"."block" = "be"."hash"',
      ]
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
            DELETE FROM "typeorm_metadata"
            WHERE "type" = ?
                AND "name" = ?
        `,
      ['VIEW', 'revenue_chart_data']
    );
    await queryRunner.query(`
            DROP VIEW "revenue_chart_data"
        `);
    await queryRunner.query(
      `
            DELETE FROM "typeorm_metadata"
            WHERE "type" = ?
                AND "name" = ?
        `,
      ['VIEW', 'revenue_view']
    );
    await queryRunner.query(`
            DROP VIEW "revenue_view"
        `);
    await queryRunner.query(`
            DROP TABLE "revenue_entity"
        `);
    await queryRunner.query(`
            DROP TABLE "token_entity"
        `);
    await queryRunner.query(`
            DROP TABLE "tx_entity"
        `);
    await queryRunner.query(`
            DROP TABLE "observation_status_entity"
        `);
  }
}
