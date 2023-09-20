import { MigrationInterface, QueryRunner } from 'typeorm';

export class WatcherMigration1695193411148 implements MigrationInterface {
  name = 'WatcherMigration1695193411148';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // token_entity is a cache table. so we must delete all data end create it again
    await queryRunner.query(`
            DROP TABLE "token_entity"
        `);
    await queryRunner.query(`
            CREATE TABLE "token_entity" (
                "tokenId" varchar PRIMARY KEY NOT NULL,
                "tokenName" varchar NOT NULL,
                "decimal" integer NOT NULL
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
