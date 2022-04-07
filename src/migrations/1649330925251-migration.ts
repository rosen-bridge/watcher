import { MigrationInterface, QueryRunner } from "typeorm"

export class migration1649330925251 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "block_entity" ALTER COLUMN "hash" RENAME TO "hashg"`,
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
