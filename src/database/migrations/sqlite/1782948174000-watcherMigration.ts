import {
  MigrationInterface,
  QueryRunner,
} from '@rosen-bridge/extended-typeorm';

export class WatcherMigration1782948174000 implements MigrationInterface {
  name = 'WatcherMigration1782948174000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
      DELETE FROM "typeorm_metadata"
      WHERE "type" = ?
        AND "name" = ?
    `,
      ['VIEW', 'revenue_chart_data']
    );

    await queryRunner.query(`
    DROP VIEW IF EXISTS "revenue_chart_data"
  `);

    await queryRunner.query(
      `
      DELETE FROM "typeorm_metadata"
      WHERE "type" = ?
        AND "name" = ?
    `,
      ['VIEW', 'revenue_view']
    );

    await queryRunner.query(`
    DROP VIEW IF EXISTS "revenue_view"
  `);
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public async down(): Promise<void> {}
}
