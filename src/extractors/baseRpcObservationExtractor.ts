import { AbstractLogger } from '@rosen-bridge/abstract-logger';
import { EvmRpcObservationExtractor } from '@rosen-bridge/evm-observation-extractor';
import { DataSource } from '@rosen-bridge/extended-typeorm';
import { EvmEthersRosenExtractor } from '@rosen-bridge/rosen-extractor';
import { TokenMap } from '@rosen-bridge/tokens';

class BaseRpcObservationExtractor extends EvmRpcObservationExtractor {
  readonly FROM_CHAIN = 'base';

  constructor(
    lockAddress: string,
    dataSource: DataSource,
    tokens: TokenMap,
    logger?: AbstractLogger,
    storeRawData = true
  ) {
    super(
      dataSource,
      tokens,
      new EvmEthersRosenExtractor(
        lockAddress,
        tokens,
        'base',
        'eth',
        logger?.child('EvmEthersRosenExtractor'),
        storeRawData
      ),
      logger
    );
  }

  getId = () => 'base-rpc-extractor';
}

export { BaseRpcObservationExtractor };
