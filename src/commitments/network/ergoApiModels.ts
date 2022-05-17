
export type NodeRegister = { [key: string]: string };

export type NodeToken = {
    tokenId: string;
    amount: number;
};

export type NodeInputBox = {
    boxId: string,
};

export type NodeOutputBox = {
    boxId: string;
    value: number;
    index: number;
    creationHeight: number;
    ergoTree: string;
    assets: NodeToken[];
    additionalRegisters: NodeRegister;
    transactionId: string;
};

export type NodeTransaction = {
    id: string,
    inputs: NodeInputBox[],
    outputs: NodeOutputBox[],
    dataInputs: NodeInputBox[],
}

export type NodeBlock = {
    headerId: string
    transactions: NodeTransaction[]
}
