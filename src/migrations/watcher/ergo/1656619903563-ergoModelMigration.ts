import { MigrationInterface, QueryRunner } from "typeorm";

export class ergoModelMigration1656619903563 implements MigrationInterface {
    name = 'ergoModelMigration1656619903563'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "ergo_block_entity" 
                (
                    "height" integer PRIMARY KEY NOT NULL, 
                    "hash" varchar(64) NOT NULL, 
                    CONSTRAINT "UQ_64718472c0cce0eb194e0611116" UNIQUE ("hash")
                )`
        );
        await queryRunner.query(`CREATE TABLE "ergo_observation_entity" 
                (
                    "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, 
                    "fromChain" varchar(30) NOT NULL, 
                    "toChain" varchar(30) NOT NULL, 
                    "fromAddress" varchar NOT NULL, 
                    "toAddress" varchar NOT NULL, 
                    "amount" varchar NOT NULL, 
                    "fee" varchar NOT NULL, 
                    "sourceChainTokenId" varchar NOT NULL, 
                    "targetChainTokenId" varchar NOT NULL, 
                    "sourceTxId" varchar NOT NULL, 
                    "sourceBlockId" varchar NOT NULL, 
                    "requestId" varchar NOT NULL, 
                    "commitmentBoxId" varchar, 
                    "blockHeight" integer, 
                    CONSTRAINT "UQ_8ff586077f7b46526ec53c304b5" UNIQUE ("requestId"), 
                    CONSTRAINT "FK_1fad84055f366e9bafb92256188" FOREIGN KEY ("blockHeight") REFERENCES "ergo_block_entity" ("height") ON DELETE CASCADE ON UPDATE NO ACTION
                )`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "ergo_observation_entity"`);
        await queryRunner.query(`DROP TABLE "ergo_block_entity"`);
    }

}
