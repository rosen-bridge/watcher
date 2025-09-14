import { ObservationEntity } from '@rosen-bridge/abstract-observation-extractor';

export interface Block {
  hash: string;
  block_height: number;
}

export interface Observation {
  fromChain: string;
  toChain: string;
  fromAddress: string;
  toAddress: string;
  height: number;
  amount: string;
  bridgeFee: string;
  networkFee: string;
  sourceChainTokenId: string;
  targetChainTokenId: string;
  sourceTxId: string;
  sourceBlockId: string;
  requestId: string;
}

export interface Commitment {
  eventId: string;
  commitment: string;
  WID: string;
  boxId: string;
  rwtCount: string;
}

export interface CommitmentSet {
  commitments: Array<Commitment>;
  observation: ObservationEntity;
}

export interface EventStatus {
  id: number;
  status: string;
}

export interface RevenueChartRecord {
  tokenId: string;
  revenue: bigint;
  year: string;
  month?: string;
  day?: string;
  week_number?: string;
}

export interface ChartRecord {
  label: string;
  amount: string;
}
