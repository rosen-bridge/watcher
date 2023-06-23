import { MigrationInterface, QueryRunner } from 'typeorm';

export class watcherModelMigration1687342159694 implements MigrationInterface {
  name = 'watcherModelMigration1687342159694';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "revenue_entity" (
              "id" SERIAL PRIMARY KEY,
              "tokenId" VARCHAR NOT NULL,
              "amount" BIGINT NOT NULL,
              "permitId" INTEGER REFERENCES "permit_entity" (id) ON DELETE CASCADE
            );
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP TABLE "revenue_entity";
        `);
  }
}
