import rosenConfigJson from './cardano-testnet.json' assert { type: "json" };

export type rosenConfig = {
    RSN: string;
    minBoxValue: string;
    fee: string;
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
}

export const rosenConfig: rosenConfig = {
    RSN: rosenConfigJson.tokens.RSN,
    minBoxValue: "1100000",
    fee: "1100000",
    guardNFT: rosenConfigJson.tokens.GuardNFT,
    cleanupNFT: rosenConfigJson.tokens.CleanupNFT,
    cleanupConfirm: rosenConfigJson.cleanupConfirm,
    watcherPermitAddress: rosenConfigJson.addresses.WatcherPermit,
    RWTRepoAddress: rosenConfigJson.addresses.RWTRepo,
    fraudAddress: rosenConfigJson.addresses.Fraud,
    eventTriggerAddress: rosenConfigJson.addresses.WatcherTriggerEvent,
    commitmentAddress: rosenConfigJson.addresses.Commitment,
    lockAddress: rosenConfigJson.addresses.lock,
    RepoNFT: rosenConfigJson.tokens.RepoNFT,
    RWTId: rosenConfigJson.tokens.RWTId,
};

