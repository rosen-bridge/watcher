import { MigrationInterface, QueryRunner } from 'typeorm';

export class WatcherMigration1691485920917 implements MigrationInterface {
  name = 'WatcherMigration1691485920917';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE SEQUENCE IF NOT EXISTS "tx_entity_id_seq" OWNED BY "tx_entity"."id"
        `);
    await queryRunner.query(`
            ALTER TABLE "tx_entity"
            ALTER COLUMN "id"
            SET DEFAULT nextval('"tx_entity_id_seq"')
        `);
    await queryRunner.query(`
            CREATE SEQUENCE IF NOT EXISTS "revenue_entity_id_seq" OWNED BY "revenue_entity"."id"
        `);
    await queryRunner.query(`
            ALTER TABLE "revenue_entity"
            ALTER COLUMN "id"
            SET DEFAULT nextval('"revenue_entity_id_seq"')
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "revenue_entity"
            ALTER COLUMN "id" DROP DEFAULT
        `);
    await queryRunner.query(`
            DROP SEQUENCE "revenue_entity_id_seq"
        `);
    await queryRunner.query(`
            ALTER TABLE "tx_entity"
            ALTER COLUMN "id" DROP DEFAULT
        `);
    await queryRunner.query(`
            DROP SEQUENCE "tx_entity_id_seq"
        `);
  }
}
