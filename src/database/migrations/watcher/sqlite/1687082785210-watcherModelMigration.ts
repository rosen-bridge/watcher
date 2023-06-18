import { MigrationInterface, QueryRunner } from 'typeorm';

export class watcherModelMigration1687082785210 implements MigrationInterface {
  name = 'watcherModelMigration1687082785210';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE VIEW "revenue_chart_view" AS
                SELECT re."tokenId", re."amount",
                    strftime('%d', datetime(be."timestamp"/1000, 'unixepoch')) AS day,
                    strftime('%m', datetime(be."timestamp"/1000, 'unixepoch')) AS month,
                    strftime('%Y', datetime(be."timestamp"/1000, 'unixepoch')) AS year
                FROM revenue_entity re
                JOIN permit_entity pe
                    ON re."permitId" = pe.id
                JOIN block_entity be
                    ON pe.block = be.hash;
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP VIEW "revenue_chart_view";
        `);
  }
}
