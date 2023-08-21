import { MigrationInterface, QueryRunner } from 'typeorm';

export class WatcherMigration1692612522380 implements MigrationInterface {
  name = 'WatcherMigration1692612522380';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            UPDATE "observation_status_entity"
            SET status = 'timeout'
            WHERE status IN ('redeem_sent', 'redeemed')
    `);
    await queryRunner.query(`
            ALTER TYPE "public"."observation_status_entity_status_enum"
            RENAME TO "observation_status_entity_status_enum_old"
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."observation_status_entity_status_enum" AS ENUM(
                'timeout',
                'not_committed',
                'commitment_sent',
                'committed',
                'reveal_sent',
                'revealed'
            )
        `);
    await queryRunner.query(`
            ALTER TABLE "observation_status_entity"
            ALTER COLUMN "status" TYPE "public"."observation_status_entity_status_enum" USING "status"::"text"::"public"."observation_status_entity_status_enum"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."observation_status_entity_status_enum_old"
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TYPE "public"."observation_status_entity_status_enum_old" AS ENUM(
                'timeout',
                'not_committed',
                'commitment_sent',
                'committed',
                'reveal_sent',
                'revealed',
                'redeem_sent',
                'redeemed'
            )
        `);
    await queryRunner.query(`
            ALTER TABLE "observation_status_entity"
            ALTER COLUMN "status" TYPE "public"."observation_status_entity_status_enum_old" USING "status"::"text"::"public"."observation_status_entity_status_enum_old"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."observation_status_entity_status_enum"
        `);
    await queryRunner.query(`
            ALTER TYPE "public"."observation_status_entity_status_enum_old"
            RENAME TO "observation_status_entity_status_enum"
        `);
  }
}
