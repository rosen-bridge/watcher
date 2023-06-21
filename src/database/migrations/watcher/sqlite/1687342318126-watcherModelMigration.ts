import { MigrationInterface, QueryRunner } from 'typeorm';

export class watcherModelMigration1687342318126 implements MigrationInterface {
  name = 'watcherModelMigration1687342318126';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE VIEW "revenue_view" AS
                SELECT pe.id, pe."txId" "permitTxId", ete."eventId", 
                ete.height "lockHeight", ete."fromChain", ete."toChain", ete."fromAddress",
                ete."toAddress", ete."amount", ete."bridgeFee", ete."networkFee",
                ete."sourceChainTokenId" "tokenId", ete."sourceTxId" "lockTxId", 
                be.height, be.timestamp,
                CASE
                  WHEN "ete"."spendTxId" IS NULL THEN 'Doing'
                  ELSE 'Done'
                END AS "status",
                re."tokenId" "revenueTokenId", re.amount "revenueAmount"
                FROM permit_entity pe
                LEFT JOIN event_trigger_entity ete ON pe."txId" = ete."txId"
                LEFT JOIN block_entity be ON pe.block = be.hash
                LEFT JOIN revenue_entity re ON pe.id = re."permitId";
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP VIEW "revenue_view";
        `);
  }
}
