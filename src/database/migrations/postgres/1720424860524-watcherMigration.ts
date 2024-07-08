import { MigrationInterface, QueryRunner } from 'typeorm';

export class WatcherMigration1720424860524 implements MigrationInterface {
  name = 'WatcherMigration1720424860524';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TYPE "public"."tx_entity_type_enum"
            RENAME TO "tx_entity_type_enum_old"
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."tx_entity_type_enum" AS ENUM(
                'commitment',
                'trigger',
                'detach',
                'redeem',
                'permit',
                'reward'
            )
        `);
    await queryRunner.query(`
            ALTER TABLE "tx_entity"
            ALTER COLUMN "type" TYPE "public"."tx_entity_type_enum" USING "type"::"text"::"public"."tx_entity_type_enum"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."tx_entity_type_enum_old"
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TYPE "public"."tx_entity_type_enum_old" AS ENUM(
                'commitment',
                'trigger',
                'detach',
                'redeem',
                'permit'
            )
        `);
    await queryRunner.query(`
            ALTER TABLE "tx_entity"
            ALTER COLUMN "type" TYPE "public"."tx_entity_type_enum_old" USING "type"::"text"::"public"."tx_entity_type_enum_old"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."tx_entity_type_enum"
        `);
    await queryRunner.query(`
            ALTER TYPE "public"."tx_entity_type_enum_old"
            RENAME TO "tx_entity_type_enum"
        `);
  }
}
