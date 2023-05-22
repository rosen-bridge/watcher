import { MigrationInterface, QueryRunner } from 'typeorm';

export class watcherModelMigration1683891493000 implements MigrationInterface {
  name = 'watcherModelMigration1683891493000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TYPE "public"."observation_status_entity_status_enum" ADD VALUE '6'
        `);
    await queryRunner.query(`
            ALTER TYPE "public"."observation_status_entity_status_enum" ADD VALUE '7'
        `);
    await queryRunner.query(`
            ALTER TYPE "public"."tx_entity_type_enum" ADD VALUE 'redeem'
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TYPE "public"."observation_status_entity_status_enum" RENAME TO "public"."observation_status_entity_status_enum_old"
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."observation_status_entity_status_enum" AS ENUM('0', '1', '2', '3', '4', '5')
        `);
    await queryRunner.query(`
            ALTER TABLE "observation_status_entity" ALTER COLUMN "status" TYPE "public"."observation_status_entity_status_enum" USING status::text::observation_status_entity_status_enum;
        `);
    await queryRunner.query(`
            DROP TYPE "public"."observation_status_entity_status_enum_old"
        `);
    await queryRunner.query(`
            ALTER TYPE "public"."tx_entity_type_enum" RENAME TO "public"."tx_entity_type_enum_old"
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."tx_entity_type_enum" AS ENUM('commitment', 'trigger', 'detach')
        `);
    await queryRunner.query(`
            ALTER TABLE "tx_entity" ALTER COLUMN "type" TYPE "public"."tx_entity_type_enum" USING type::text::tx_entity_type_enum;
        `);
    await queryRunner.query(`
            DROP TYPE "public"."tx_entity_type_enum_old"
        `);
  }
}
