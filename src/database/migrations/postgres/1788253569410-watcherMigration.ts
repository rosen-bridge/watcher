import {
  MigrationInterface,
  QueryRunner,
} from '@rosen-bridge/extended-typeorm';

export class WatcherMigration1788253569410 implements MigrationInterface {
  name = 'WatcherMigration1788253569410';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE VIEW "revenue_view" AS
      SELECT
        pe."id" AS "id",
        pe."WID" AS "wid",
        ete."sourceChainHeight" AS "lockHeight",
        be."height" AS "height",
        be."timestamp" AS "timestamp",
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
      FROM "permit_entity" pe
      INNER JOIN "event_trigger_entity" ete
        ON pe."txId" = ete."spendTxId"
      LEFT JOIN "block_entity" be
        ON pe."block" = be."hash";
    `);

    await queryRunner.query(`
      CREATE VIEW "revenue_chart_data" AS
      SELECT
        pe."WID" AS "wid",
        be."year" AS "year",
        be."month" AS "month",
        be."day" AS "day",
        re."tokenId" AS "tokenId",
        re."amount" AS "amount",
        be."timestamp" AS "timestamp"
      FROM "revenue_entity" re
      INNER JOIN "permit_entity" pe
        ON re."permitId" = pe."id"
      INNER JOIN "block_entity" be
        ON pe."block" = be."hash";
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP VIEW IF EXISTS "revenue_chart_data";
    `);

    await queryRunner.query(`
      DROP VIEW IF EXISTS "revenue_view";
    `);
  }
}
