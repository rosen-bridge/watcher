import { BoxType } from "../entities/watcher/bridge/BoxEntity";
import { SpendReason } from "../entities/watcher/bridge/ObservedCommitmentEntity";
import { ObservationEntity } from "../entities/watcher/network/ObservationEntity";

export interface Block {
    hash: string,
    block_height: number,
}

export interface Observation {
    fromChain: string
    toChain: string
    fromAddress: string
    toAddress: string
    amount: string
    bridgeFee: string
    networkFee: string
    sourceChainTokenId: string
    targetChainTokenId: string
    sourceTxId: string
    sourceBlockId: string
    requestId: string
}

export interface Commitment{
    eventId: string,
    commitment: string,
    WID: string,
    commitmentBoxId: string
}

export interface SpecialBox{
    boxId: string,
    type: BoxType,
    value: string,
    boxJson: string
}

export interface SpentBox{
    boxId: string,
    spendReason: SpendReason
}

export interface CommitmentSet{
    commitments: Array<Commitment>,
    observation: ObservationEntity
}
