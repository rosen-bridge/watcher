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
}

export interface Commitment{
    eventId: string,
    commitment: string,
    WID: string,
    commitmentBoxId: string
}
