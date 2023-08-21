import { MigrationInterface, QueryRunner } from 'typeorm';

export class WatcherMigration1692612814917 implements MigrationInterface {
  name = 'WatcherMigration1692612814917';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "temporary_observation_status_entity" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "observationId" integer,
                "status" varchar CHECK(
                    "status" IN (
                        'timeout',
                        'not_committed',
                        'commitment_sent',
                        'committed',
                        'reveal_sent',
                        'revealed'
                    )
                ) NOT NULL,
                CONSTRAINT "REL_0a64720aa46fb4fd199a0285df" UNIQUE ("observationId"),
                CONSTRAINT "FK_0a64720aa46fb4fd199a0285df2" FOREIGN KEY ("observationId") REFERENCES "observation_entity" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_observation_status_entity"("id", "status", "observationId")
            SELECT "id",
                "status",
                "observationId"
            FROM "observation_status_entity"
        `);
    await queryRunner.query(`
            DROP TABLE "observation_status_entity"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_observation_status_entity"
                RENAME TO "observation_status_entity"
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "observation_status_entity"
                RENAME TO "temporary_observation_status_entity"
        `);
    await queryRunner.query(`
            CREATE TABLE "observation_status_entity" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "status" varchar CHECK(
                    "status" IN (
                        'timeout',
                        'not_committed',
                        'commitment_sent',
                        'committed',
                        'reveal_sent',
                        'revealed',
                        'redeem_sent',
                        'redeemed'
                    )
                ) NOT NULL,
                "observationId" integer,
                CONSTRAINT "REL_0a64720aa46fb4fd199a0285df" UNIQUE ("observationId"),
                CONSTRAINT "FK_0a64720aa46fb4fd199a0285df2" FOREIGN KEY ("observationId") REFERENCES "observation_entity" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
            )
        `);
    await queryRunner.query(`
            INSERT INTO "observation_status_entity"("id", "status", "observationId")
            SELECT "id",
                "status",
                "observationId"
            FROM "temporary_observation_status_entity"
        `);
    await queryRunner.query(`
            DROP TABLE "temporary_observation_status_entity"
        `);
  }
}
