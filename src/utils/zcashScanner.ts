import { DefaultLogger } from '@rosen-bridge/abstract-logger';
import { NativeZcashInspector } from '@rosen-bridge/rosen-extractor';
import { ZcashObservationExtractor } from '@rosen-bridge/zcash-observation-extractor';
import { ZcashRpcNetwork, ZcashRpcScanner } from '@rosen-bridge/zcash-scanner';

import { dataSource } from '../../config/dataSource';
import { RosenConfig, ZcashConfig } from '../config/config';
import { TokensConfig } from '../config/tokensConfig';
import {
  guardZcashExtraction,
  guardZcashUpdate,
  ZcashScannerLogger,
} from './zcashReadiness';

/** The scheduled watcher and local integration exercise use the same source scanner. */
export const createZcashObservationScanner = async (
  zcashConfig: ZcashConfig,
  rosenConfig: RosenConfig,
  storeRawData: boolean
) => {
  const logger = new ZcashScannerLogger(
    DefaultLogger.getInstance().child('zcashScanner'),
    [zcashConfig.rpc.username ?? '', zcashConfig.rpc.password ?? '']
  );
  const network = new ZcashRpcNetwork({
    rpcUrl: zcashConfig.rpc.url,
    timeoutMs: zcashConfig.rpc.timeoutMs,
    expectedGenesisHash: zcashConfig.expectedGenesisHash,
    auth:
      zcashConfig.rpc.username && zcashConfig.rpc.password
        ? {
            username: zcashConfig.rpc.username,
            password: zcashConfig.rpc.password,
          }
        : undefined,
  });
  const scanner = new ZcashRpcScanner({
    dataSource,
    initialHeight: zcashConfig.initialHeight,
    network,
    logger,
  });
  scanner.update = guardZcashUpdate(logger, scanner.update.bind(scanner));
  const extractor = new ZcashObservationExtractor(dataSource, {
    network: zcashConfig.network,
    lockAddress: rosenConfig.lockAddress,
    tokens: TokensConfig.getInstance().getTokenMap(),
    inspector: new NativeZcashInspector(zcashConfig.inspector),
    branchIdAtHeight: zcashConfig.branchIdAtHeight,
    logger,
    storeRawData,
  });
  // Do not mark a block PROCEED if an upstream extractor logged and swallowed
  // an error. The persisted cursor must remain before the ambiguous block.
  extractor.processTransactions = guardZcashExtraction(
    logger,
    extractor.processTransactions.bind(extractor)
  );
  await scanner.registerExtractor(extractor);
  return { scanner, logger };
};
