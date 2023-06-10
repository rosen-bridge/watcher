import { MigrationInterface, QueryRunner } from 'typeorm';

export class watcherModelMigration1685285583000 implements MigrationInterface {
  name = 'watcherModelMigration1685285583000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TYPE "public"."tx_entity_type_enum" ADD VALUE 'permit'
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TYPE "public"."tx_entity_type_enum" RENAME TO "public"."tx_entity_type_enum_old"
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."tx_entity_type_enum" AS ENUM('commitment', 'trigger', 'detach', 'redeem')
        `);
    await queryRunner.query(`
            ALTER TABLE "tx_entity" ALTER COLUMN "type" TYPE "public"."tx_entity_type_enum" USING type::text::tx_entity_type_enum;
        `);
    await queryRunner.query(`
            DROP TYPE "public"."tx_entity_type_enum_old"
        `);
  }
}
