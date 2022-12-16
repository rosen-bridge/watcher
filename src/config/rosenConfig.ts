import fs from 'fs';
import { Config } from './config';

const ergoConfig = Config.getConfig();

type rosenConfigType = {
  RSN: string;
  guardNFT: string;
  cleanupNFT: string;
  cleanupConfirm: number;
  watcherPermitAddress: string;
  RWTRepoAddress: string;
  fraudAddress: string;
  eventTriggerAddress: string;
  commitmentAddress: string;
  lockAddress: string;
  RepoNFT: string;
  RWTId: string;
};

class RosenConfig {
  readonly RSN: string;
  readonly guardNFT: string;
  readonly cleanupNFT: string;
  readonly cleanupConfirm: number;
  readonly watcherPermitAddress: string;
  readonly RWTRepoAddress: string;
  readonly fraudAddress: string;
  readonly eventTriggerAddress: string;
  readonly commitmentAddress: string;
  readonly lockAddress: string;
  readonly RepoNFT: string;
  readonly RWTId: string;

  constructor(network: string, networkType: string) {
    const rosenConfigPath = this.getAddress(network, networkType);
    if (!fs.existsSync(rosenConfigPath)) {
      throw new Error(
        `rosenConfig file with path ${rosenConfigPath} doesn't exist`
      );
    } else {
      const configJson: string = fs.readFileSync(rosenConfigPath, 'utf8');
      const config = JSON.parse(configJson);
      this.RSN = config.tokens.RSN;
      this.guardNFT = config.tokens.GuardNFT;
      this.cleanupNFT = config.tokens.CleanupNFT;
      this.cleanupConfirm = config.cleanupConfirm;
      this.watcherPermitAddress = config.addresses.WatcherPermit;
      this.RWTRepoAddress = config.addresses.RWTRepo;
      this.fraudAddress = config.addresses.Fraud;
      this.eventTriggerAddress = config.addresses.WatcherTriggerEvent;
      this.commitmentAddress = config.addresses.Commitment;
      this.lockAddress = config.addresses.lock;
      this.RepoNFT = config.tokens.RepoNFT;
      this.RWTId = config.tokens.RWTId;
    }
  }

  getAddress = (network: string, networkType: string) => {
    return (
      ergoConfig.rosenConfigPath + `contracts-${network}-${networkType}.json`
    );
  };
}

const network = ergoConfig.networkWatcher.split('-')[0].toLowerCase();
const networkType = ergoConfig.networkType.toLowerCase();
const rosenConfig: rosenConfigType = new RosenConfig(network, networkType);

export { RosenConfig, rosenConfigType, rosenConfig };
