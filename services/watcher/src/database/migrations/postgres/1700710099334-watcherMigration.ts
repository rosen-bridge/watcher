import { MigrationInterface, QueryRunner } from 'typeorm';

export class WatcherMigration1700710099334 implements MigrationInterface {
  name = 'WatcherMigration1700710099334';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TYPE "public"."observation_status_entity_status_enum" AS ENUM(
                'timeout',
                'not_committed',
                'commitment_sent',
                'committed',
                'reveal_sent',
                'revealed'
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "observation_status_entity" (
                "id" SERIAL NOT NULL,
                "status" "public"."observation_status_entity_status_enum" NOT NULL,
                "observationId" integer,
                CONSTRAINT "REL_0a64720aa46fb4fd199a0285df" UNIQUE ("observationId"),
                CONSTRAINT "PK_5715187826e97c18ce283d84772" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."tx_entity_type_enum" AS ENUM(
                'commitment',
                'trigger',
                'detach',
                'redeem',
                'permit'
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "tx_entity" (
                "id" SERIAL NOT NULL,
                "creationTime" integer NOT NULL,
                "updateBlock" integer NOT NULL,
                "type" "public"."tx_entity_type_enum" NOT NULL,
                "txId" character varying NOT NULL,
                "txSerialized" character varying NOT NULL,
                "deleted" boolean NOT NULL,
                "isValid" boolean NOT NULL DEFAULT true,
                "observationId" integer,
                CONSTRAINT "PK_33a26fe467b7d364d894e7de852" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "token_entity" (
                "tokenId" character varying NOT NULL,
                "tokenName" character varying NOT NULL,
                "decimals" integer NOT NULL,
                CONSTRAINT "PK_732f4eb57d5546f7bb9ae040b83" PRIMARY KEY ("tokenId")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "revenue_entity" (
                "id" SERIAL NOT NULL,
                "tokenId" character varying NOT NULL,
                "amount" bigint NOT NULL,
                "permitId" integer,
                CONSTRAINT "PK_f3cebb4ca44c0f562eebb5ca4a8" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            ALTER TABLE "observation_status_entity"
            ADD CONSTRAINT "FK_0a64720aa46fb4fd199a0285df2" FOREIGN KEY ("observationId") REFERENCES "observation_entity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "tx_entity"
            ADD CONSTRAINT "FK_b5b6231b330927b9625ef8560de" FOREIGN KEY ("observationId") REFERENCES "observation_entity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "revenue_entity"
            ADD CONSTRAINT "FK_4f13caf82f774b5d38d406aabb1" FOREIGN KEY ("permitId") REFERENCES "permit_entity"("id") ON DELETE CASCADE ON UPDATE NO ACTION
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
            VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)
        `,
      [
        'public',
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
            VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)
        `,
      [
        'public',
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
            WHERE "type" = $1
                AND "name" = $2
                AND "schema" = $3
        `,
      ['VIEW', 'revenue_chart_data', 'public']
    );
    await queryRunner.query(`
            DROP VIEW "revenue_chart_data"
        `);
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
            ALTER TABLE "revenue_entity" DROP CONSTRAINT "FK_4f13caf82f774b5d38d406aabb1"
        `);
    await queryRunner.query(`
            ALTER TABLE "tx_entity" DROP CONSTRAINT "FK_b5b6231b330927b9625ef8560de"
        `);
    await queryRunner.query(`
            ALTER TABLE "observation_status_entity" DROP CONSTRAINT "FK_0a64720aa46fb4fd199a0285df2"
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
            DROP TYPE "public"."tx_entity_type_enum"
        `);
    await queryRunner.query(`
            DROP TABLE "observation_status_entity"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."observation_status_entity_status_enum"
        `);
  }
}
