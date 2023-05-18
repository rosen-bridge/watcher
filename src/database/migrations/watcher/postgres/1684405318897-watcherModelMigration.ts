import { MigrationInterface, QueryRunner } from 'typeorm';

export class watcherModelMigration1684405318897 implements MigrationInterface {
  name = 'watcherModelMigration1684405318897';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "token_entity" (
                "tokenId" varchar NOT NULL,
                "tokenName" varchar
            )
    `);

    await queryRunner.query(`
            CREATE INDEX idx_token_entity_tokenId ON "token_entity" ("tokenId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP TABLE "token_entity" CASCADE
    `);
  }
}
