import { MigrationInterface, QueryRunner } from 'typeorm';

export class watcherModelMigration1686490574850 implements MigrationInterface {
  name = 'watcherModelMigration1686490574850';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "revenue_entity" (
              "id" INTEGER PRIMARY KEY,
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
