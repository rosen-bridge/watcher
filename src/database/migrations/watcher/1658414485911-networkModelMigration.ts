// import { MigrationInterface, QueryRunner } from "typeorm";
//
// export class networkModelMigration1658414485911 implements MigrationInterface {
//     name = 'networkModelMigration1658414485911'
//
//     public async up(queryRunner: QueryRunner): Promise<void> {
//         await queryRunner.query(`CREATE TABLE "block_entity" (
//                                         "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
//                                         "height" integer NOT NULL,
//                                         "hash" varchar(64) NOT NULL,
//                                         "parentHash" varchar(64) NOT NULL,
//                                         "status" varchar NOT NULL,
//                                         "scanner" varchar NOT NULL,
//                                         CONSTRAINT "UQ_7e20625b11840edf7f120565c3d" UNIQUE ("parentHash", "scanner"),
//                                         CONSTRAINT "UQ_b1e24c5950a7c3dd48d92bbfbb2" UNIQUE ("hash", "scanner"),
//                                         CONSTRAINT "UQ_521d830047d5fe08988538289dd" UNIQUE ("height", "scanner"))`
//         );
//         await queryRunner.query(
//             `CREATE TABLE "observation_entity"
//                     ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
//                     "fromChain" varchar(30) NOT NULL,
//                     "toChain" varchar(30) NOT NULL,
//                     "fromAddress" varchar NOT NULL,
//                     "toAddress" varchar NOT NULL,
//                     "height" INTEGER NOT NULL,
//                     "amount" varchar NOT NULL,
//                     "networkFee" varchar NOT NULL,
//                     "bridgeFee" varchar NOT NULL,
//                     "sourceChainTokenId" varchar NOT NULL,
//                     "targetChainTokenId" varchar NOT NULL,
//                     "sourceTxId" varchar NOT NULL,
//                     "sourceBlockId" varchar NOT NULL,
//                     "requestId" varchar NOT NULL,
//                     "block" varchar NOT NULL,
//                     "status" varchar CHECK( "status" IN ('0','1','2','3','4','5') ) NOT NULL,
//                     "extractor" varchar NOT NULL,
//                     CONSTRAINT "UQ_f0af4ab9dd56c983ce8a83adcbf" UNIQUE ("requestId")
//                 )`
//         );
//         await queryRunner.query(
//             `CREATE TABLE "tx_entity" (
//                     "id" integer PRIMARY KEY NOT NULL,
//                     "creationTime" integer NOT NULL,
//                     "updateBlock" integer NOT NULL,
//                     "type" varchar CHECK( "type" IN ('commitment','trigger') ) NOT NULL,
//                     "txId" varchar NOT NULL, "txSerialized" varchar NOT NULL,
//                     "deleted" boolean NOT NULL, "observationId" integer,
//                     CONSTRAINT "FK_b5b6231b330927b9625ef8560de" FOREIGN KEY ("observationId") REFERENCES "observation_entity" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
//                 )`
//         );
//         await queryRunner.query(
//             `CREATE TABLE "commitment_entity"
//                     ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
//                     "extractor" varchar NOT NULL,
//                     "eventId" varchar NOT NULL,
//                     "commitment" varchar NOT NULL,
//                     "WID" varchar NOT NULL,
//                     "commitmentBoxId" varchar NOT NULL,
//                     "blockId" varchar NOT NULL,
//                     "height" INTEGER NOT NULL,
//                     "spendBlockHash" varchar,
//                     "spendBlockHeight" INTEGER
//                 )`
//         );
//         await queryRunner.query(
//             `CREATE TABLE "event_trigger_entity"
//                     ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
//                     "extractor" varchar NOT NULL,
//                     "boxId" varchar NOT NULL,
//                     "boxSerialized" varchar NOT NULL,
//                     "blockId" varchar NOT NULL,
//                     "fromChain" varchar NOT NULL,
//                     "toChain" varchar NOT NULL,
//                     "fromAddress" varchar NOT NULL,
//                     "toAddress" varchar NOT NULL,
//                     "amount" varchar NOT NULL,
//                     "bridgeFee" varchar NOT NULL,
//                     "networkFee" varchar NOT NULL,
//                     "sourceChainTokenId" varchar NOT NULL,
//                     "targetChainTokenId" varchar NOT NULL,
//                     "sourceBlockId" varchar NOT NULL,
//                     "sourceTxId" varchar NOT NULL,
//                     "height" INTEGER NOT NULL,
//                     "WIDs" varchar NOT NULL
//                 )`
//         );
//         await queryRunner.query(
//             `CREATE TABLE "permit_entity"
//                     ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
//                     "extractor" varchar NOT NULL,
//                     "boxId" varchar NOT NULL,
//                     "boxSerialized" varchar NOT NULL,
//                     "blockId" varchar NOT NULL,
//                     "height" INTEGER NOT NULL,
//                     "WID" varchar NOT NULL,
//                     "spendBlockHash" varchar,
//                     "spendBlockHeight" INTEGER
//                 )`
//         );
//     }
//
//     public async down(queryRunner: QueryRunner): Promise<void> {
//         await queryRunner.query(`DROP TABLE "tx_entity"`);
//         await queryRunner.query(`DROP TABLE "observation_entity"`);
//         await queryRunner.query(`DROP TABLE "block_entity"`);
//     }
//
// }
