import { MigrationInterface, QueryRunner } from 'typeorm';

export class WatcherMigration1703244656364 implements MigrationInterface {
  name = 'WatcherMigration1703244656364';

  public async up(queryRunner: QueryRunner): Promise<void> {
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
    await queryRunner.query(`
            CREATE VIEW "revenue_chart_data" AS
            SELECT "pe"."WID" AS "wid",
                "be"."year" AS "year",
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
        'SELECT "pe"."WID" AS "wid", "be"."year" AS "year", "be"."month" AS "month", "be"."day" AS "day", re."tokenId" AS "tokenId", re."amount" AS "amount", be."timestamp" AS "timestamp" FROM "revenue_entity" "re" INNER JOIN "permit_entity" "pe" ON re."permitId" = "pe"."id"  INNER JOIN "block_entity" "be" ON "pe"."block" = "be"."hash"',
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
}
