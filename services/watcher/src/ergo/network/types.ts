export type TxInput = {
  boxId: string;
  address: string;
  assets: Array<Asset>;
};

export type TxOutput = {
  address: string;
  assets: Array<Asset>;
};

export type ErgoTx = {
  inputs: Array<TxInput>;
  outputs: Array<TxOutput>;
};

export type Asset = {
  tokenId: string;
  index?: number;
  amount: bigint;
  name?: string;
};

export interface ExplorerBox {
  boxId: string;
  address: string;
  value: bigint;
  assets?: Array<Asset>;
  spentTransactionId: string;
}

export interface ExplorerBoxes {
  items: Array<ExplorerBox>;
  total: number;
}

/**
 * TODO: There are some nuances between `ExplorerBox` and `NodeBox`. Although
 * these different properties are not used here (as neither of the types are
 * complete), they are separated to prevent future issues.
 * To fix it, we need to extract all these types to a new package, complete them
 * and use them here.
 * https://git.ergopool.io/ergo/rosen-bridge/watcher/-/issues/62
 */

export interface NodeBox {
  boxId: string;
  address: string;
  value: bigint;
  assets?: Array<Asset>;
  spentTransactionId: string;
}

export interface ExplorerTransaction {
  id: string;
  creationTimestamp: number;
  numConfirmations: number;
}

export interface ErgoAssetInfo {
  id: string;
  boxId: string;
  emissionAmount: bigint;
  name?: string;
  description?: string;
  type?: string;
  decimals?: number;
}
