import { MigrationInterface, QueryRunner } from 'typeorm';

export class WatcherMigration1695572684455 implements MigrationInterface {
  name = 'WatcherMigration1695572684455';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
            DELETE FROM "typeorm_metadata"
            WHERE "type" = $1
                AND "name" = $2
                AND "schema" = $3
        `,
      ['VIEW', 'revenue_view', 'public']
    );
    await queryRunner.query(`
            DROP VIEW "revenue_view"
        `);
    await queryRunner.query(`
            CREATE VIEW "revenue_view" AS
            SELECT "pe"."id" AS "id",
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
            VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)
        `,
      [
        'public',
        'VIEW',
        'revenue_view',
        'SELECT "pe"."id" AS "id", "ete"."sourceChainHeight" AS "lockHeight", "be"."height" AS "height", "be"."timestamp" AS "timestamp", pe."txId" AS "permitTxId", ete."eventId" AS "eventId", ete."fromChain" AS "fromChain", ete."toChain" AS "toChain", ete."fromAddress" AS "fromAddress", ete."toAddress" AS "toAddress", ete."amount" AS "amount", ete."bridgeFee" AS "bridgeFee", ete."networkFee" AS "networkFee", ete."sourceChainTokenId" AS "tokenId", ete."sourceTxId" AS "lockTxId" FROM "permit_entity" "pe" INNER JOIN "event_trigger_entity" "ete" ON pe."txId" = ete."spendTxId"  LEFT JOIN "block_entity" "be" ON "pe"."block" = "be"."hash"',
      ]
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
            DELETE FROM "typeorm_metadata"
            WHERE "type" = $1
                AND "name" = $2
                AND "schema" = $3
        `,
      ['VIEW', 'revenue_view', 'public']
    );
    await queryRunner.query(`
            DROP VIEW "revenue_view"
        `);
    await queryRunner.query(`
            CREATE VIEW "revenue_view" AS
            SELECT "pe"."id" AS "id",
                "ete"."sourceChainHeight" AS "lockHeight",
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
                ete."sourceTxId" AS "lockTxId"
            FROM "permit_entity" "pe"
                LEFT JOIN "event_trigger_entity" "ete" ON pe."txId" = ete."spendTxId"
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
            VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)
        `,
      [
        'public',
        'VIEW',
        'revenue_view',
        'SELECT "pe"."id" AS "id", "ete"."sourceChainHeight" AS "lockHeight", "be"."height" AS "height", "be"."timestamp" AS "timestamp", "re"."tokenId" AS "revenueTokenId", "re"."amount" AS "revenueAmount", pe."txId" AS "permitTxId", ete."eventId" AS "eventId", ete."fromChain" AS "fromChain", ete."toChain" AS "toChain", ete."fromAddress" AS "fromAddress", ete."toAddress" AS "toAddress", ete."amount" AS "amount", ete."bridgeFee" AS "bridgeFee", ete."networkFee" AS "networkFee", ete."sourceChainTokenId" AS "tokenId", ete."sourceTxId" AS "lockTxId" FROM "permit_entity" "pe" LEFT JOIN "event_trigger_entity" "ete" ON pe."txId" = ete."spendTxId"  LEFT JOIN "block_entity" "be" ON "pe"."block" = "be"."hash"  LEFT JOIN "revenue_entity" "re" ON "pe"."id" = re."permitId"',
      ]
    );
  }
}
