import { MigrationInterface, QueryRunner } from 'typeorm';

export class watcherModelMigration1678166758664 implements MigrationInterface {
  name = 'watcherModelMigration1678166758664';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TYPE "public"."observation_status_entity_status_enum" AS ENUM('0', '1', '2', '3', '4', '5')
        `);
    await queryRunner.query(`
            CREATE TABLE "observation_status_entity" (
                "id" SERIAL NOT NULL,
                "status" "public"."observation_status_entity_status_enum" NOT NULL,
                "observationId" integer,
                CONSTRAINT "REL_0a64720aa46fb4fd199a0285df" UNIQUE ("observationId"),
                CONSTRAINT "PK_5715187826e97c18ce283d84772" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."tx_entity_type_enum" AS ENUM('commitment', 'trigger', 'detach')
        `);
    await queryRunner.query(`
            CREATE TABLE "tx_entity" (
                "id" integer NOT NULL,
                "creationTime" integer NOT NULL,
                "updateBlock" integer NOT NULL,
                "type" "public"."tx_entity_type_enum" NOT NULL,
                "txId" character varying NOT NULL,
                "txSerialized" character varying NOT NULL,
                "deleted" boolean NOT NULL,
                "observationId" integer,
                CONSTRAINT "PK_33a26fe467b7d364d894e7de852" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            ALTER TABLE "observation_status_entity"
            ADD CONSTRAINT "FK_0a64720aa46fb4fd199a0285df2" FOREIGN KEY ("observationId") REFERENCES "observation_entity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "tx_entity"
            ADD CONSTRAINT "FK_b5b6231b330927b9625ef8560de" FOREIGN KEY ("observationId") REFERENCES "observation_entity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "tx_entity" DROP CONSTRAINT "FK_b5b6231b330927b9625ef8560de"
        `);
    await queryRunner.query(`
            ALTER TABLE "observation_status_entity" DROP CONSTRAINT "FK_0a64720aa46fb4fd199a0285df2"
        `);
    await queryRunner.query(`
            DROP TABLE "tx_entity"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."tx_entity_type_enum"
        `);
    await queryRunner.query(`
            DROP TABLE "observation_status_entity"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."observation_status_entity_status_enum"
        `);
  }
}
