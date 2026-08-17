import {
  MigrationInterface,
  QueryRunner,
} from '@rosen-bridge/extended-typeorm';

export class WatcherMigration1784715486000 implements MigrationInterface {
  name = 'WatcherMigration1784715486000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const height = 13706176;
    await queryRunner.query(
      `UPDATE tx_entity
       set "observationId" = NULL
       WHERE "observationId" in (SELECT id FROM observation_entity WHERE height > ${height} AND "fromChain" = 'cardano')`
    );
    await queryRunner.query(
      `DELETE FROM observation_status_entity
       where "observationId" in (SELECT id FROM observation_entity WHERE height > ${height} AND "fromChain" = 'cardano')`
    );
    await queryRunner.query(
      `DELETE FROM observation_entity where height > ${height} AND "fromChain" = 'cardano'`
    );
    await queryRunner.query(
      `DELETE FROM block_entity where height > ${height} AND scanner = 'cardano'`
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public async down(): Promise<void> {}
}
