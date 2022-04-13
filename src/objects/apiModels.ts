export interface Block {
    hash: string,
    block_height: number,
}

export interface Asset {
    policy_id: string,
    asset_name: string,
    quantity: string
}

export interface Utxo {
    payment_addr: {
        bech32: string
    },
    tx_hash: string,
    value: string,
    asset_list: Array<Asset>
}

export interface Tx {
    utxos: Array<Utxo>
}
