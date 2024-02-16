import { MigrationInterface, QueryRunner } from 'typeorm';

export class WatcherMigration1704105040303 implements MigrationInterface {
  name = 'WatcherMigration1704105040303';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DELETE FROM "observation_status_entity"
        `);
  }

  public async down(): Promise<void> {
    return;
  }
}
