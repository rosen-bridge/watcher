import { MigrationInterface, QueryRunner } from 'typeorm';

export class watcherModelMigration1687342218146 implements MigrationInterface {
  name = 'watcherModelMigration1687342218146';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE VIEW "revenue_view" AS
      SELECT "pe"."id" AS "id",
          pe."txId" AS "permitTxId",
          ete."eventId" AS "eventId",
          ete."sourceChainHeight" AS "lockHeight",
          ete."fromChain" AS "fromChain",
          ete."toChain" AS "toChain",
          ete."fromAddress" AS "fromAddress",
          ete."toAddress" AS "toAddress",
          ete."amount" AS "amount",
          ete."bridgeFee" AS "bridgeFee",
          ete."networkFee" AS "networkFee",
          ete."sourceChainTokenId" AS "tokenId",
          ete."sourceTxId" AS "lockTxId",
          pe."height" AS "height",
          be."timestamp" AS "timestamp",
          re."tokenId" AS "revenueTokenId",
          re."amount" AS "revenueAmount"
      FROM "permit_entity" "pe"
          LEFT JOIN "event_trigger_entity" "ete" ON pe."txId" = ete."spendTxId"
          LEFT JOIN "block_entity" "be" ON "pe"."block" = "be"."hash"
          LEFT JOIN "revenue_entity" "re" ON "pe"."id" = re."permitId"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP VIEW "revenue_view";
        `);
  }
}
