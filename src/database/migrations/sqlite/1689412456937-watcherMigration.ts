import { MigrationInterface, QueryRunner } from 'typeorm';

export class WatcherMigration1689412456937 implements MigrationInterface {
  name = 'WatcherMigration1689412456937';

  public async up(queryRunner: QueryRunner): Promise<void> {
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
                        'revealed',
                        'redeem_sent',
                        'redeemed'
                    )
                ) NOT NULL,
                "observationId" integer,
                CONSTRAINT "REL_0a64720aa46fb4fd199a0285df" UNIQUE ("observationId")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "tx_entity" (
                "id" integer PRIMARY KEY NOT NULL,
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
                "observationId" integer
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "token_entity" (
                "tokenId" varchar PRIMARY KEY NOT NULL,
                "tokenName" varchar NOT NULL
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "revenue_entity" (
                "id" integer PRIMARY KEY NOT NULL,
                "tokenId" varchar NOT NULL,
                "amount" bigint NOT NULL,
                "permitId" integer
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "temporary_observation_status_entity" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "status" varchar CHECK(
                    "status" IN (
                        'timeout',
                        'not_committed',
                        'commitment_sent',
                        'committed',
                        'reveal_sent',
                        'revealed',
                        'redeem_sent',
                        'redeemed'
                    )
                ) NOT NULL,
                "observationId" integer,
                CONSTRAINT "REL_0a64720aa46fb4fd199a0285df" UNIQUE ("observationId"),
                CONSTRAINT "FK_0a64720aa46fb4fd199a0285df2" FOREIGN KEY ("observationId") REFERENCES "observation_entity" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_observation_status_entity"("id", "status", "observationId")
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
    await queryRunner.query(`
            CREATE TABLE "temporary_tx_entity" (
                "id" integer PRIMARY KEY NOT NULL,
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
            CREATE TABLE "temporary_revenue_entity" (
                "id" integer PRIMARY KEY NOT NULL,
                "tokenId" varchar NOT NULL,
                "amount" bigint NOT NULL,
                "permitId" integer,
                CONSTRAINT "FK_4f13caf82f774b5d38d406aabb1" FOREIGN KEY ("permitId") REFERENCES "permit_entity" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_revenue_entity"("id", "tokenId", "amount", "permitId")
            SELECT "id",
                "tokenId",
                "amount",
                "permitId"
            FROM "revenue_entity"
        `);
    await queryRunner.query(`
            DROP TABLE "revenue_entity"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_revenue_entity"
                RENAME TO "revenue_entity"
        `);
    await queryRunner.query(`
            CREATE VIEW "revenue_view" AS
            SELECT "pe"."id" AS "id",
                "ete"."height" AS "lockHeight",
                "be"."height" AS "height",
                "be"."timestamp" AS "timestamp",
                "re"."tokenId" AS "revenueTokenId",
                "re"."amount" AS "revenueAmount",
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
                ete."sourceTxId" AS "lockTxId",
                CASE
                    WHEN "ete"."spendTxId" IS NULL THEN 'Doing'
                    ELSE 'Done'
                END AS "status"
            FROM "permit_entity" "pe"
                LEFT JOIN "event_trigger_entity" "ete" ON pe."txId" = ete."txId"
                LEFT JOIN "block_entity" "be" ON "pe"."block" = "be"."hash"
                LEFT JOIN "revenue_entity" "re" ON "pe"."id" = re."permitId"
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
        'SELECT "pe"."id" AS "id", "ete"."height" AS "lockHeight", "be"."height" AS "height", "be"."timestamp" AS "timestamp", "re"."tokenId" AS "revenueTokenId", "re"."amount" AS "revenueAmount", pe."txId" AS "permitTxId", ete."eventId" AS "eventId", ete."fromChain" AS "fromChain", ete."toChain" AS "toChain", ete."fromAddress" AS "fromAddress", ete."toAddress" AS "toAddress", ete."amount" AS "amount", ete."bridgeFee" AS "bridgeFee", ete."networkFee" AS "networkFee", ete."sourceChainTokenId" AS "tokenId", ete."sourceTxId" AS "lockTxId", CASE WHEN "ete"."spendTxId" IS NULL THEN \'Doing\' ELSE \'Done\' END AS "status" FROM "permit_entity" "pe" LEFT JOIN "event_trigger_entity" "ete" ON pe."txId" = ete."txId"  LEFT JOIN "block_entity" "be" ON "pe"."block" = "be"."hash"  LEFT JOIN "revenue_entity" "re" ON "pe"."id" = re."permitId"',
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
            ALTER TABLE "revenue_entity"
                RENAME TO "temporary_revenue_entity"
        `);
    await queryRunner.query(`
            CREATE TABLE "revenue_entity" (
                "id" integer PRIMARY KEY NOT NULL,
                "tokenId" varchar NOT NULL,
                "amount" bigint NOT NULL,
                "permitId" integer
            )
        `);
    await queryRunner.query(`
            INSERT INTO "revenue_entity"("id", "tokenId", "amount", "permitId")
            SELECT "id",
                "tokenId",
                "amount",
                "permitId"
            FROM "temporary_revenue_entity"
        `);
    await queryRunner.query(`
            DROP TABLE "temporary_revenue_entity"
        `);
    await queryRunner.query(`
            ALTER TABLE "tx_entity"
                RENAME TO "temporary_tx_entity"
        `);
    await queryRunner.query(`
            CREATE TABLE "tx_entity" (
                "id" integer PRIMARY KEY NOT NULL,
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
                "observationId" integer
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
            CREATE TABLE "observation_status_entity" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "status" varchar CHECK(
                    "status" IN (
                        'timeout',
                        'not_committed',
                        'commitment_sent',
                        'committed',
                        'reveal_sent',
                        'revealed',
                        'redeem_sent',
                        'redeemed'
                    )
                ) NOT NULL,
                "observationId" integer,
                CONSTRAINT "REL_0a64720aa46fb4fd199a0285df" UNIQUE ("observationId")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "observation_status_entity"("id", "status", "observationId")
            SELECT "id",
                "status",
                "observationId"
            FROM "temporary_observation_status_entity"
        `);
    await queryRunner.query(`
            DROP TABLE "temporary_observation_status_entity"
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
