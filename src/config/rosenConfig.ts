import fs from 'fs';
import path from 'path';
import { decodeAddress, encodeAddress } from '@rosen-bridge/address-codec';
import { BITCOIN_CASH_CHAIN_NAME } from './constants';

class RosenConfig {
  readonly RSN: string;
  readonly guardNFT: string;
  readonly minFeeNFT: string;
  readonly cleanupNFT: string;
  readonly cleanupConfirm: number;
  readonly watcherPermitAddress: string;
  readonly watcherCollateralAddress: string;
  readonly RWTRepoAddress: string;
  readonly fraudAddress: string;
  readonly eventTriggerAddress: string;
  readonly commitmentAddress: string;
  readonly lockAddress: string;
  readonly rwtRepoNFT: string;
  readonly RWTId: string;
  readonly repoConfigAddress: string;
  readonly repoConfigNFT: string;
  readonly AWC: string;
  readonly emissionNFT: string;
  readonly emissionAddress: string;
  readonly eRSN: string;
  readonly contractVersion: string;

  constructor(network: string, rosenConfigPath: string) {
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

    this.rwtRepoNFT = config.tokens.RWTRepoNFT;
    this.guardNFT = config.tokens.GuardNFT;
    this.RSN = config.tokens.RSN;
    this.minFeeNFT = config.tokens.MinFeeNFT;
    this.emissionNFT = config.tokens.EmissionNFT;
    this.eRSN = config.tokens.ERSN;

    this.cleanupConfirm = chainConfig.cleanupConfirm;

    this.RWTRepoAddress = chainConfig.addresses.RWTRepo;
    this.watcherPermitAddress = chainConfig.addresses.WatcherPermit;
    this.fraudAddress = chainConfig.addresses.Fraud;
    this.lockAddress = chainConfig.addresses.lock;
    if (network === BITCOIN_CASH_CHAIN_NAME) {
      if (
        typeof this.lockAddress !== 'string' ||
        this.lockAddress.length !== 54 ||
        decodeAddress(network, encodeAddress(network, this.lockAddress)) !==
          this.lockAddress
      )
        throw Error(
          'Bitcoin Cash lock must be a canonical lowercase prefixed native P2PKH20/P2SH20 CashAddr'
        );
    }
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
}

export { RosenConfig };
