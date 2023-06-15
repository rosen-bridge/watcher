import { MigrationInterface, QueryRunner } from 'typeorm';

export class watcherModelMigration1686842459848 implements MigrationInterface {
  name = 'watcherModelMigration1686842459848';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "revenue_chart_entity" (
              "id" INTEGER PRIMARY KEY,
              "year" INTEGER NOT NULL,
              "month" INTEGER NOT NULL,
              "day" INTEGER NOT NULL,
              "revenue" INTEGER NOT NULL
            );
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP TABLE "revenue_chart_entity";
        `);
  }
}
