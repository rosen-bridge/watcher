import { MigrationInterface, QueryRunner } from 'typeorm';

export class watcherModelMigration1687342250269 implements MigrationInterface {
  name = 'watcherModelMigration1687342250269';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE VIEW "revenue_chart_data" AS
                SELECT re."tokenId", re."amount", be."timestamp",
                    extract(day from to_timestamp(be."timestamp"/1000)) AS day,
                    extract(month from to_timestamp(be."timestamp"/1000)) AS month,
                    extract(year from to_timestamp(be."timestamp"/1000)) AS year
                FROM revenue_entity re
                JOIN permit_entity pe
                    ON re."permitId" = pe.id
                JOIN block_entity be
                    ON pe.block = be.hash;
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP VIEW "revenue_chart_data";
        `);
  }
}
