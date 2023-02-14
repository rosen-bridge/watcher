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

type Asset = {
  tokenId: string;
  index: number;
  amount: bigint;
  name: string;
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

export interface ExplorerTransaction {
  id: string;
  creationTimestamp: number;
  numConfirmations: number;
}
