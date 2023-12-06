import { MigrationInterface, QueryRunner } from 'typeorm';

export class WatcherMigration1699702069196 implements MigrationInterface {
  name = 'WatcherMigration1699702069196';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "tx_entity"
            ADD "isValid" boolean NOT NULL DEFAULT true
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "tx_entity" DROP COLUMN "isValid"
        `);
  }
}
