import {
  MigrationInterface,
  QueryRunner,
} from '@rosen-bridge/extended-typeorm';

export class WatcherMigration1781716748001 implements MigrationInterface {
  name = 'WatcherMigration1781716748001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop views that depend on permit_entity before modifying/removing
    // entities related to permit_entity.

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
