
export type ExplorerRegister = {
    serializedValue: string,
    sigmaType: string,
    renderedValue: string
}

export type ExplorerToken = {
    tokenId: string;
    index: number;
    amount: number;
    name: string;
    decimals: number;
    type: string;
};

export type ExplorerInputBox = {
    boxId: string;
    value: number;
    outputTransactionId: string;
    outputBlockId: string,
    outputIndex: number;
    creationHeight: number;
    ergoTree: string;
    address: string;
    assets: ExplorerToken[];
    additionalRegisters: {[key: string]: ExplorerRegister};
    spentTransactionId: string;
};

export type ExplorerOutputBox = {
    boxId: string;
    transactionId: string;
    blockId: string,
    value: number;
    index: number;
    creationHeight: number;
    ergoTree: string;
    address: string;
    assets: ExplorerToken[];
    additionalRegisters: {[key: string]: ExplorerRegister};
    spentTransactionId: string;
};

export type ExplorerTransaction = {
    id: string,
    creationTimestamp: number,
    numConfirmations: number,
    inputs: ExplorerInputBox[],
    outputs: ExplorerOutputBox[],
}

export type ExplorerBlockHeader = {
    id: string,
    height: number,
}

export type ExplorerBlock = {
    block: {
        header: ExplorerBlockHeader,
        blockTransactions: ExplorerTransaction[]
    }
}
