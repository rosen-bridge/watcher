import fs from 'fs';
import path from 'path';

class RosenConfig {
  readonly RSN: string;
  readonly guardNFT: string;
  readonly MinFeeNFT: string;
  readonly cleanupNFT: string;
  readonly cleanupConfirm: number;
  readonly watcherPermitAddress: string;
  readonly watcherCollateralAddress: string;
  readonly RWTRepoAddress: string;
  readonly fraudAddress: string;
  readonly eventTriggerAddress: string;
  readonly commitmentAddress: string;
  readonly lockAddress: string;
  readonly RWTRepoNFT: string;
  readonly RWTId: string;
  readonly repoConfigAddress: string;
  readonly repoConfigNFT: string;
  readonly AWC: string;
  readonly emissionNFT: string;
  readonly emissionAddress: string;
  readonly eRSN: string;
  readonly contractVersion: string;

  constructor(network: string, networkType: string, configRoot: string) {
    const rosenConfigPath = this.getAddress(networkType, configRoot);
    if (!fs.existsSync(rosenConfigPath)) {
      throw new Error(
        `rosenConfig file with path ${rosenConfigPath} doesn't exist`
      );
    }
    const configJson: string = fs.readFileSync(rosenConfigPath, 'utf8');
    const config = JSON.parse(configJson);
    if (!config[network]) {
      throw new Error(`Network '${network}' not found in contracts file`);
    }
    const chainConfig = config[network];

    this.contractVersion = config.version;

    this.RWTRepoNFT = config.tokens.RWTRepoNFT;
    this.guardNFT = config.tokens.GuardNFT;
    this.RSN = config.tokens.RSN;
    this.MinFeeNFT = config.tokens.MinFeeNFT;
    this.emissionNFT = config.tokens.EmissionNFT;
    this.eRSN = config.tokens.ERSN;

    this.cleanupConfirm = chainConfig.cleanupConfirm;

    this.RWTRepoAddress = chainConfig.addresses.RWTRepo;
    this.watcherPermitAddress = chainConfig.addresses.WatcherPermit;
    this.fraudAddress = chainConfig.addresses.Fraud;
    this.lockAddress = chainConfig.addresses.lock;
    this.commitmentAddress = chainConfig.addresses.Commitment;
    this.eventTriggerAddress = chainConfig.addresses.WatcherTriggerEvent;
    this.watcherCollateralAddress = chainConfig.addresses.WatcherCollateral;
    this.repoConfigAddress = chainConfig.addresses.RepoConfig;
    this.emissionAddress = chainConfig.addresses.Emission;

    this.cleanupNFT = chainConfig.tokens.CleanupNFT;
    this.RWTId = chainConfig.tokens.RWTId;
    this.repoConfigNFT = chainConfig.tokens.RepoConfigNFT;
    this.AWC = chainConfig.tokens.AwcNFT;
  }

  getAddress = (networkType: string, configRoot: string) => {
    return path.join(configRoot, `contracts-${networkType}.json`);
  };
}

export { RosenConfig };
