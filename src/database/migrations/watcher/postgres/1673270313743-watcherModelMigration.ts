import { MigrationInterface, QueryRunner } from 'typeorm';

export class watcherModelMigration1673270313743 implements MigrationInterface {
  name = 'watcherModelMigration1673270313743';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          CREATE TABLE "observation_status_entity" (
            "id" serial PRIMARY KEY NOT NULL,
            "status" varchar CHECK("status" IN ('0', '1', '2', '3', '4', '5')) NOT NULL,
            "observationId" integer,
            CONSTRAINT "REL_0a64720aa46fb4fd199a0285df" UNIQUE ("observationId"),
            CONSTRAINT "FK_0a64720aa46fb4fd199a0285df2" FOREIGN KEY ("observationId") REFERENCES "observation_entity" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
          )
        `);
    await queryRunner.query(`
          CREATE TABLE "tx_entity" (
            "id" integer PRIMARY KEY NOT NULL,
            "creationTime" bigint NOT NULL,
            "updateBlock" integer NOT NULL,
            "type" varchar CHECK("type" IN ('commitment', 'trigger')) NOT NULL,
            "txId" varchar NOT NULL,
            "txSerialized" varchar NOT NULL,
            "deleted" boolean NOT NULL,
            "observationId" integer,
            CONSTRAINT "FK_b5b6231b330927b9625ef8560de" FOREIGN KEY ("observationId") REFERENCES "observation_entity" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
          )
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP TABLE "tx_entity"
        `);
    await queryRunner.query(`
            DROP TABLE "observation_status_entity"
        `);
  }
}
