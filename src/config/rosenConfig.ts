import fs from 'fs';
import path from 'path';

class RosenConfig {
  readonly RSN: string;
  readonly guardNFT: string;
  readonly rsnRatioNFT: string;
  readonly cleanupNFT: string;
  readonly cleanupConfirm: number;
  readonly watcherPermitAddress: string;
  readonly watcherCollateralAddress: string;
  readonly RWTRepoAddress: string;
  readonly fraudAddress: string;
  readonly eventTriggerAddress: string;
  readonly commitmentAddress: string;
  readonly lockAddress: string;
  readonly RepoNFT: string;
  readonly RWTId: string;
  readonly repoConfigAddress: string;
  readonly repoConfigNFT: string;
  readonly AWC: string;
  readonly emissionNFT: string;
  readonly emissionAddress: string;
  readonly eRSN: string;
  readonly contractVersion: string;

  constructor(network: string, networkType: string, configRoot: string) {
    const rosenConfigPath = this.getAddress(network, networkType, configRoot);
    if (!fs.existsSync(rosenConfigPath)) {
      throw new Error(
        `rosenConfig file with path ${rosenConfigPath} doesn't exist`
      );
    } else {
      const configJson: string = fs.readFileSync(rosenConfigPath, 'utf8');
      const config = JSON.parse(configJson);
      this.RSN = config.tokens.RSN;
      this.guardNFT = config.tokens.GuardNFT;
      this.rsnRatioNFT = config.tokens.RSNRatioNFT;
      this.cleanupNFT = config.tokens.CleanupNFT;
      this.cleanupConfirm = config.cleanupConfirm;
      this.watcherPermitAddress = config.addresses.WatcherPermit;
      this.watcherCollateralAddress = config.addresses.WatcherCollateral;
      this.RWTRepoAddress = config.addresses.RWTRepo;
      this.fraudAddress = config.addresses.Fraud;
      this.eventTriggerAddress = config.addresses.WatcherTriggerEvent;
      this.commitmentAddress = config.addresses.Commitment;
      this.lockAddress = config.addresses.lock;
      this.RepoNFT = config.tokens.RepoNFT;
      this.RWTId = config.tokens.RWTId;
      this.repoConfigAddress = config.addresses.RepoConfig;
      this.repoConfigNFT = config.tokens.RepoConfigNFT;
      this.AWC = config.tokens.AwcNFT;
      this.emissionNFT = config.tokens.EmissionNFT;
      this.eRSN = config.tokens.ERSN;
      this.emissionAddress = config.addresses.Emission;
      this.contractVersion = config.version;
    }
  }

  getAddress = (network: string, networkType: string, configRoot: string) => {
    return path.join(configRoot, `contracts-${network}-${networkType}.json`);
  };
}

export { RosenConfig };
