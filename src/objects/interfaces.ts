import { BoxType } from "../entities/BoxEntity";

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
    fee: string
    sourceChainTokenId: string
    targetChainTokenId: string
    sourceTxId: string
    sourceBlockId: string
    requestId: string
    commitmentBoxId?: string
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

export interface CommitmentSet{
    commitments: Array<Commitment>,
    observation: Observation
}
