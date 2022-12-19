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

export interface ErgoBoxJson {
  boxId: string;
  address: string;
  value: bigint;
  assets?: Array<Asset>;
}

export interface AddressBoxes {
  items: Array<ErgoBoxJson>;
  total: number;
}

export interface ExplorerTransaction {
  id: string;
  creationTimestamp: number;
  numConfirmations: number;
}
