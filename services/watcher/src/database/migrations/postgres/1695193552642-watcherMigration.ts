import { MigrationInterface, QueryRunner } from 'typeorm';

export class WatcherMigration1695193552642 implements MigrationInterface {
  name = 'WatcherMigration1695193552642';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP TABLE "token_entity"
        `);
    await queryRunner.query(`
            CREATE TABLE "token_entity" (
                "tokenId" varchar PRIMARY KEY NOT NULL,
                "tokenName" varchar NOT NULL,
                "decimals" integer NOT NULL
            )
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP TABLE "token_entity"
        `);
    await queryRunner.query(`
            CREATE TABLE "token_entity" (
                "tokenId" varchar PRIMARY KEY NOT NULL,
                "tokenName" varchar NOT NULL
            )
        `);
  }
}
