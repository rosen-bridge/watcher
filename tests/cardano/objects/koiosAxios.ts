import MockAdapter from "axios-mock-adapter";
import { koios } from "../../../src/cardano/network/koios";
import { explorerApi, nodeClient } from "../../../src/ergo/network/ergoNetwork";

const mockedAxios = new MockAdapter(koios);

mockedAxios.onGet(
    '/blocks',
    {params: {block_height: `eq.3433333`, select: 'hash,block_height'}}
).reply(200, [
    {
        "hash": "26197be6579e09c7edec903239866fbe7ff6aee2e4ed4031c64d242e9dd1bff6",
        "block_height": 3433333
    }
]);

mockedAxios.onGet(
    '/blocks',
    {params: {offset: 0, limit: 1, select: 'hash,block_height'}}
).reply(200, [
    {
        "hash": "ccb85a5f2f10bd1468e0cd9679a6bea360962747e2b60b73fa43abe98b09d15c",
        "block_height": 3433334
    }
]);

mockedAxios.onGet(
    '/blocks',
    {params: {block_height: `eq.3433334`, select: 'hash,block_height'}}
).reply(200, [
    {
        "hash": "ccb85a5f2f10bd1468e0cd9679a6bea360962747e2b60b73fa43abe98b09d15c",
        "block_height": 3433334
    }
]);

mockedAxios.onGet(
    '/blocks',
    {params: {block_height: `eq.3433330`, select: 'hash,block_height'}}
).reply(200, [
    {
        "hash": "19b60182cba99d621b3d02457fefb4cda81f4fbde3ca719617cbed2e4cc5c0ce",
        "block_height": 3433330
    }
]);

mockedAxios.onGet(
    '/blocks',
    {params: {offset: 5, limit: 3, select: 'hash,block_height'}}
).reply(200, [
    {
        "hash": "e1699582bd2e3426839e10f7f5066bafc6e3847fd4511a2013ba3b4e13514267",
        "block_height": 3433332
    },
    {
        "hash": "397e969e0525d82dc46a33e31634187dae94b12a6cc4b534e4e52f6d313aef22",
        "block_height": 3433331
    },
    {
        "hash": "19b60182cba99d621b3d02457fefb4cda81f4fbde3ca719617cbed2e4cc5c0ce",
        "block_height": 3433330
    }
]);

mockedAxios.onGet(
    '/block_txs',
    {params: {_block_hash: "26197be6579e09c7edec903239866fbe7ff6aee2e4ed4031c64d242e9dd1bff6"}}
).reply(200, [
    {
        "tx_hash": "18c74381954f093a3ca919df4380c9d9111396b9ad95bf4f16a94355d52cabc0"
    },
    {
        "tx_hash": "6c8368f62a91e6687dc677feb27f7724fcb398509ecd2bdde1866ed49353918d"
    },
    {
        "tx_hash": "b194ce1c11399822eb7f3288a67fbb0e295b7954f170ecacfc779a886dd11179"
    },
    {
        "tx_hash": "0ea5fb179e359bfb5de00831eb58fa830d8d6eede0b0c9eaa09286439616a340"
    },
    {
        "tx_hash": "ccb85a5f2f10bd1468e0cd9679a6bea360962747e2b60b73fa43abe98b09d15c"
    },
    {
        "tx_hash": "03cf541bfe93ede8489e0a3f1f1f94e34a4116399f8bd03619efca192961e47a"
    },
    {
        "tx_hash": "1a0d06c44fa9bb4fce5900e2d31031f9db38da29f4acc9d525c30dae67ea6609"
    },
    {
        "tx_hash": "b092027357f70831dd34dd34cea54146c11e844dc194b4c2ea841bce7cd19816"
    }
]);

mockedAxios.onGet(
    '/block_txs',
    {params: {_block_hash: "93395496d590ec6db0f2fd13a7bcf91e82a9f230ef677f6216ea8c9f57df6ab3"}}
).reply(200, [
        {
            "tx_hash": "edce02f2f23ddc3270964d2ba74ff6375a5a78fd6caf1c66102565b83f5d3ca2"
        },
        {
            "tx_hash": "cf32ad374daefdce563e3391effc4fc42eb0e74bbec8afe16a46eeea69e3b2aa"
        }
    ]
);

mockedAxios.onGet(
    '/block_txs',
    {params: {_block_hash: "ccb85a5f2f10bd1468e0cd9679a6bea360962747e2b60b73fa43abe98b09d15c"}}
).reply(200, [
        {
            "tx_hash": "edce02f2f23ddc3270964d2ba74ff6375a5a78fd6caf1c66102565b83f5d3ca2"
        },
        {
            "tx_hash": "cf32ad374daefdce563e3391effc4fc42eb0e74bbec8afe16a46eeea69e3b2aa"
        }
    ]
);

mockedAxios.onPost(
    '/tx_utxos',
    {
        _tx_hashes: ["cf32ad374daefdce563e3391effc4fc42eb0e74bbec8afe16a46eeea69e3b2aa"]
    }).reply(200,
    [
        {
            "tx_hash": "cf32ad374daefdce563e3391effc4fc42eb0e74bbec8afe16a46eeea69e3b2aa",
            "inputs": [
                {
                    "payment_addr": {
                        "bech32": "addr_test1vzg07d2qp3xje0w77f982zkhqey50gjxrsdqh89yx8r7nasu97hr0",
                        "cred": "90ff35400c4d2cbddef24a750ad7064947a2461c1a0b9ca431c7e9f6"
                    },
                    "stake_addr": null,
                    "tx_hash": "9f00d372e930d685c3b410a10f2bd035cd9a927c4fd8ef8e419c79b210af7ba6",
                    "tx_index": 1,
                    "value": "979445417",
                    "asset_list": [
                        {
                            "policy_id": "ace7bcc2ce705679149746620de3a84660ce57573df54b5a096e39a2",
                            "asset_name": "646f6765",
                            "quantity": "10000000"
                        },
                        {
                            "policy_id": "ace7bcc2ce705679149746620de3a84660ce57573df54b5a096e39a2",
                            "asset_name": "7369676d61",
                            "quantity": "9999978"
                        }
                    ]
                }
            ],
            "outputs": [
                {
                    "payment_addr": {
                        "bech32": "addr_test1vze7yqqlg8cjlyhz7jzvsg0f3fhxpuu6m3llxrajfzqecggw704re",
                        "cred": "b3e2001f41f12f92e2f484c821e98a6e60f39adc7ff30fb248819c21"
                    },
                    "stake_addr": null,
                    "tx_hash": "cf32ad374daefdce563e3391effc4fc42eb0e74bbec8afe16a46eeea69e3b2aa",
                    "tx_index": 0,
                    "value": "10000000",
                    "asset_list": [
                        {
                            "policy_id": "ace7bcc2ce705679149746620de3a84660ce57573df54b5a096e39a2",
                            "asset_name": "7369676d61",
                            "quantity": "10"
                        }
                    ]
                },
                {
                    "payment_addr": {
                        "bech32": "addr_test1vzg07d2qp3xje0w77f982zkhqey50gjxrsdqh89yx8r7nasu97hr0",
                        "cred": "90ff35400c4d2cbddef24a750ad7064947a2461c1a0b9ca431c7e9f6"
                    },
                    "stake_addr": null,
                    "tx_hash": "cf32ad374daefdce563e3391effc4fc42eb0e74bbec8afe16a46eeea69e3b2aa",
                    "tx_index": 1,
                    "value": "969261084",
                    "asset_list": [
                        {
                            "policy_id": "ace7bcc2ce705679149746620de3a84660ce57573df54b5a096e39a2",
                            "asset_name": "646f6765",
                            "quantity": "10000000"
                        },
                        {
                            "policy_id": "ace7bcc2ce705679149746620de3a84660ce57573df54b5a096e39a2",
                            "asset_name": "7369676d61",
                            "quantity": "9999968"
                        }
                    ]
                }
            ]
        }
    ]
);

mockedAxios.onPost(
    '/tx_utxos',
    {
        _tx_hashes: ["edce02f2f23ddc3270964d2ba74ff6375a5a78fd6caf1c66102565b83f5d3ca2"]
    }).reply(200,
    [
        {
            "tx_hash": "edce02f2f23ddc3270964d2ba74ff6375a5a78fd6caf1c66102565b83f5d3ca2",
            "inputs": [
                {
                    "payment_addr": {
                        "bech32": "addr_test1vra2radc0sj882n9cuwwvzwyxxz442hxy06ftuyakzjxdlcxlstkz",
                        "cred": "faa1f5b87c2473aa65c71ce609c431855aaae623f495f09db0a466ff"
                    },
                    "stake_addr": null,
                    "tx_hash": "6f213bbeb895ebdb3805052f9e0c98b812d37ddaf8604157962171c3499a10ad",
                    "tx_index": 1,
                    "value": "23500000",
                    "asset_list": [
                        {
                            "policy_id": "3794c001b97da7a47823ad27b29e049985a9a97f8aa6908429180e2c",
                            "asset_name": "506c7574757350424c436f757273653031",
                            "quantity": "1"
                        },
                        {
                            "policy_id": "cef5bfce1ff3fc5b128296dd0aa87e075a8ee8833057230c192c4059",
                            "asset_name": "706c6179",
                            "quantity": "400"
                        }
                    ]
                },
                {
                    "payment_addr": {
                        "bech32": "addr_test1wrsdlj8k39g4e3rgsza9lstjqctrlml5mghvywf9m4e288gwxshfq",
                        "cred": "e0dfc8f689515cc46880ba5fc17206163feff4da2ec23925dd72a39d"
                    },
                    "stake_addr": null,
                    "tx_hash": "8220660833eca5e8dbe1d0067efcbc2fb5c7a2f41f2ea42be8ae87af343cd147",
                    "tx_index": 1,
                    "value": "25500000",
                    "asset_list": [
                        {
                            "policy_id": "cef5bfce1ff3fc5b128296dd0aa87e075a8ee8833057230c192c4059",
                            "asset_name": "706c6179",
                            "quantity": "400"
                        }
                    ]
                }
            ],
            "outputs": [
                {
                    "payment_addr": {
                        "bech32": "addr_test1vra2radc0sj882n9cuwwvzwyxxz442hxy06ftuyakzjxdlcxlstkz",
                        "cred": "faa1f5b87c2473aa65c71ce609c431855aaae623f495f09db0a466ff"
                    },
                    "stake_addr": null,
                    "tx_hash": "edce02f2f23ddc3270964d2ba74ff6375a5a78fd6caf1c66102565b83f5d3ca2",
                    "tx_index": 0,
                    "value": "20776498",
                    "asset_list": []
                },
                {
                    "payment_addr": {
                        "bech32": "addr_test1wzd82fzfkrfjqnzpvjyzauve5ssw8wkhgepkd84jggx5n3gful79d",
                        "cred": "9a752449b0d3204c4164882ef199a420e3bad74643669eb2420d49c5"
                    },
                    "stake_addr": null,
                    "tx_hash": "edce02f2f23ddc3270964d2ba74ff6375a5a78fd6caf1c66102565b83f5d3ca2",
                    "tx_index": 1,
                    "value": "5000000",
                    "asset_list": [
                        {
                            "policy_id": "3794c001b97da7a47823ad27b29e049985a9a97f8aa6908429180e2c",
                            "asset_name": "506c7574757350424c436f757273653031",
                            "quantity": "1"
                        },
                        {
                            "policy_id": "cef5bfce1ff3fc5b128296dd0aa87e075a8ee8833057230c192c4059",
                            "asset_name": "706c6179",
                            "quantity": "50"
                        }
                    ]
                },
                {
                    "payment_addr": {
                        "bech32": "addr_test1wrsdlj8k39g4e3rgsza9lstjqctrlml5mghvywf9m4e288gwxshfq",
                        "cred": "e0dfc8f689515cc46880ba5fc17206163feff4da2ec23925dd72a39d"
                    },
                    "stake_addr": null,
                    "tx_hash": "edce02f2f23ddc3270964d2ba74ff6375a5a78fd6caf1c66102565b83f5d3ca2",
                    "tx_index": 2,
                    "value": "20500000",
                    "asset_list": [
                        {
                            "policy_id": "cef5bfce1ff3fc5b128296dd0aa87e075a8ee8833057230c192c4059",
                            "asset_name": "706c6179",
                            "quantity": "350"
                        }
                    ]
                },
                {
                    "payment_addr": {
                        "bech32": "addr_test1vra2radc0sj882n9cuwwvzwyxxz442hxy06ftuyakzjxdlcxlstkz",
                        "cred": "faa1f5b87c2473aa65c71ce609c431855aaae623f495f09db0a466ff"
                    },
                    "stake_addr": null,
                    "tx_hash": "edce02f2f23ddc3270964d2ba74ff6375a5a78fd6caf1c66102565b83f5d3ca2",
                    "tx_index": 3,
                    "value": "2000000",
                    "asset_list": [
                        {
                            "policy_id": "cef5bfce1ff3fc5b128296dd0aa87e075a8ee8833057230c192c4059",
                            "asset_name": "706c6179",
                            "quantity": "400"
                        }
                    ]
                }
            ]
        }
    ]
);


mockedAxios.onPost(
    "/tx_metadata",
    {
        _tx_hashes: ["cf32ad374daefdce563e3391effc4fc42eb0e74bbec8afe16a46eeea69e3b2aa"]
    }).reply(200,
    [{
        "tx_hash": "cf32ad374daefdce563e3391effc4fc42eb0e74bbec8afe16a46eeea69e3b2aa",
        "metadata": {
            "0": {
                "to": "ERGO",
                "fee": "10000",
                "from": "CARDANO",
                "toAddress": "ergoAddress",
                "fromAddress": "cardanoAddress",
                "targetChainTokenId": "cardanoTokenId"
            }
        }
    }]
);
