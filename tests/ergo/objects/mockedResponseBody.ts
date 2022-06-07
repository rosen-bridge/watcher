export const mockedResponseBody = {
    watcherUnspentBoxes:
        `{
        "items": [
            {
                "boxId": "3ac7e967200368b6a95f0714d24f830161fb0d5c7c173beae316969687ba98af",
                "transactionId": "dc84702d37d98367149572e1e01361c66e1b4f531ea7e0813b510e3fec91fbeb",
                "blockId": "0918e0d916d547902cf67ddab4020d12690ca558252871dd6f5c150dcd8dad2a",
                "value": 100000,
                "index": 2,
                "globalIndex": 469394,
                "creationHeight": 214337,
                "settlementHeight": 214339,
                "ergoTree": "0008cd03c29ad59831be2e5baded45a03ce9a7d4c2e83d683e11c79790e76f640d0d3e30",
                "address": "9hwWcMhrebk4Ew5pBpXaCJ7zuH8eYkY9gRfLjNP3UeBYNDShGCT",
                "assets": [
                    {
                        "tokenId": "4911d8b1e96bccba5cbbfe2938578b3b58a795156518959fcbfc3bd7232b35a8",
                        "index": 0,
                        "amount": 1,
                        "name": null,
                        "decimals": null,
                        "type": null
                    }
                ],
                "additionalRegisters": {},
                "spentTransactionId": null,
                "mainChain": true
            },
            {
                "boxId": "762a25c986e4cc2dfbad6e092b214307ab88de9a073d01e80c17a81efab6d98b",
                "transactionId": "e841baa12e63bdf30f72c789b0ec2f6c4af382aaa47749a00d963a8a7d7bc243",
                "blockId": "7cc00b6bcf22346f376005a60120409468b104b7044c851048e29dd07452e606",
                "value": 94500000,
                "index": 1,
                "globalIndex": 464579,
                "creationHeight": 211940,
                "settlementHeight": 211942,
                "ergoTree": "0008cd03c29ad59831be2e5baded45a03ce9a7d4c2e83d683e11c79790e76f640d0d3e30",
                "address": "9hwWcMhrebk4Ew5pBpXaCJ7zuH8eYkY9gRfLjNP3UeBYNDShGCT",
                "assets": [
                    {
                        "tokenId": "a2a6c892c38d508a659caf857dbe29da4343371e597efd42e40f9bc99099a516",
                        "index": 0,
                        "amount": 100,
                        "name": "RSN",
                        "decimals": 0,
                        "type": "EIP-004"
                    },
                    {
                        "tokenId": "bc01703067be4e0effc54f742a6c62ef6edc289e49df3c2e08ada204fb1e14c3",
                        "index": 1,
                        "amount": 1,
                        "name": null,
                        "decimals": null,
                        "type": null
                    }
                ],
                "additionalRegisters": {},
                "spentTransactionId": null,
                "mainChain": true
            },
            {
                "boxId": "61b4f0080f8af2046a26fbaeca3e7404075b9b2ae4d74d07920abac09a6a766b",
                "transactionId": "1dd5df72468937e6e277bdd74d265919457c8c7b320053c7d503dcdf1bf67343",
                "blockId": "e0e906cc014e89448432b632f0c65720048c5240d5b8d0a61af050887a05885e",
                "value": 10000000,
                "index": 0,
                "globalIndex": 446913,
                "creationHeight": 203158,
                "settlementHeight": 203160,
                "ergoTree": "0008cd03c29ad59831be2e5baded45a03ce9a7d4c2e83d683e11c79790e76f640d0d3e30",
                "address": "9hwWcMhrebk4Ew5pBpXaCJ7zuH8eYkY9gRfLjNP3UeBYNDShGCT",
                "assets": [
                    {
                        "tokenId": "34a217f1d2bc0f84607dad61c886de53f1ca919c389f184136f05a0de1d196f2",
                        "index": 0,
                        "amount": 100,
                        "name": "testt",
                        "decimals": 0,
                        "type": "EIP-004"
                    }
                ],
                "additionalRegisters": {},
                "spentTransactionId": null,
                "mainChain": true
            },
            {
                "boxId": "18bb8ff0fdb2c005405ddee776e08303f6a129495e2a0e68969fe5e25844a689",
                "transactionId": "fa8be159e331ba1e94e4a7facd8b4ab84a53b3512df30b836ba5c81cb299f167",
                "blockId": "4ee00ea11d241afc4f032dddad50ee953974d67d870e314058e20e16f365e5ed",
                "value": 10000000,
                "index": 0,
                "globalIndex": 446867,
                "creationHeight": 203142,
                "settlementHeight": 203144,
                "ergoTree": "0008cd03c29ad59831be2e5baded45a03ce9a7d4c2e83d683e11c79790e76f640d0d3e30",
                "address": "9hwWcMhrebk4Ew5pBpXaCJ7zuH8eYkY9gRfLjNP3UeBYNDShGCT",
                "assets": [
                    {
                        "tokenId": "2c966d5840c8725aff53414b3e60f494d4f1b79e642c9ef806e6536ec32f77f9",
                        "index": 0,
                        "amount": 100,
                        "name": "myt",
                        "decimals": 1000,
                        "type": "EIP-004"
                    }
                ],
                "additionalRegisters": {},
                "spentTransactionId": null,
                "mainChain": true
            }
        ],
        "total": 4
    }
`,

    repoBoxMemPool:
        `{
            "items": [
                {
                    "id": "a52262ecb452c8a0919b4e571fab2abfa69787bae07a9a9d081821740d4ee7cf",
                    "creationTimestamp": 1654155718493,
                    "inputs": [
                        {
                            "boxId": "d1907f8d9b649ab27eaba1f5788ff22a0ab5e5ae37187bc8c0ee32dccfc74c6d",
                            "value": 1100000,
                            "index": 0,
                            "spendingProof": null,
                            "outputBlockId": "28c42900f573326fcd77ed7fefd8ee3d89c3b4212e1ccc7f97c4c994ae9cbdc4",
                            "outputTransactionId": "cd847939a0a22e2042be88e2bb7f547c742ea723da3d91563fdc978928255cb4",
                            "outputIndex": 0,
                            "ergoTree": "101c040204000e20a6ac381e6fa99929fd1477b3ba9499790a775e91d4c14c5aa86e9a118dfac8530101040204000402040404040400040004020402040204000400040004000e2013fe3ae277a195b83048e3e268529118fa4c18cca0931e3b48a8f5fccec75bc9040404000400040204020400040004000400d801d601b2a473000095938cb2db63087201730100017302d17303d811d602db6308a7d603b27202730400d6048c720302d605b2a5730500d606db63087205d607b27206730600d6088c720702d609e4c6a70511d60ab17209d60be4c672050511d60cb1720bd60de4c6a70611d60eb27206730700d60f8c720e02d610b27202730800d6118c721002d6129683050193c27205c2a793e4c672050611720d938cb27206730900018cb27202730a0001938c7207018c720301938c720e018c721001959172047208d806d613e4c67205041ad6149a720a730bd61599720c730cd616c5a7d6179972047208d618b2a5730d00d196830c01721293b17213721493b47213730e7215e4c6a7041a93b27213721500721693720c721493b4720b730f7215720993b2720b7215007217939c7217b2720d73100099720f7211938cb2db6308721873110002721793cbc27218731293e4c67218041a83010e7216938cb2db6308b2a5731300731400017216d804d613e4c6a7041ad614e4c672050704d6159972087204d616b27209721400d19683040172129383010eb27213721400e4c67201041a939c7215b2720d731500997211720f959172167215968302019372169ab2720b7214007215937213e4c67205041ad803d617e4c67205041ad6189a72147316d61999720a731796830501937216721593b4721373187214b472177319721493b472137218720ab472177214721993b47209731a7214b4720b731b721493b472097218720ab4720b72147219",
                            "address": "N9nHZxAm7Z476Nbw6yF2X6BQEct7nNCm4SJeCK8DJEkERj6LXMJvKqG49WWSfNDufuuFEtN8msfWDd8UR4QUCmLEwFRWXC5hxEdk1XhdRSgiwuqyiPqpSTXtqUgGf67uCzEtHtN5nQKKuRYyr6xfFfV8YXKhms5JVqhmCM9869Nr4KzmLAdSLqwG6LswnFwRWwZZfC6Jf65RKV4xV5GTDqL5Ppc2QwnGDYFEUPPgLdskLbDAgwfDgE2mZnCfovUGmCjinh8UD1tW3AKfBPjFJbdF6eST8SB7EpDt162cZu7992Gaa3jNYwYnJKGKqU1izwb2WRVC3yXSHFQxr8GkTa3uQ9WAL1hyMSSNg7GqzF5a8GXFUTCw97zXUevKjtBAKxmjLQTfsmDdzYTe1oBNXEgffhVndtxhCfViYbnHVHUqEv8NQA8xiZaEzj9eCfrYyPepiq1sRruFwgjqhqhpetrQaKcSXmFjeFzCHnDR3aAV9dXQr6SyqAf7p7ML9H4rYNhLJAc4Usbuq8rVH8ysmTZPb7erhWmKXG8yFWqc6mE6tekXUuyvPhh3uXJWZgc6Z2RDbDNRvZNkxbUMDEDfb3iLtcNd3wGGLFndzryQNft8FZS4xwaskVZFQkFga3dfCgkMv3NAXrRTPmrDYD2WgurR8PfewJAJ2nu4GpMJadgTkkkLYvgrVxC8jp3w39dXzSCKAcQ7cGWyvYW6HK1s1VcG9QiogDf6YhM5mfroCCn6HweQ7hDdYtRvSyuDBVaZAJmhxKBffsGsApKocqPeZMjo8hsRr3bWgJA2xBhzxn42HCgDf2qULBH4b9HN5N3hyR7WURyVr9Y1vXwFTakEtMsr861X88mi2yUi7aqRh3XAFoN11Do9N34UPSzreELFk3SCxJT4uAdsKQrCm5yRo1zt5Mgh4tpHfgk4SsY7",
                            "assets": [
                                {
                                    "tokenId": "a40b86c663fbbfefa243c9c6ebbc5690fc4e385f15b44c49ba469c91c5af0f48",
                                    "index": 0,
                                    "amount": 1,
                                    "name": "RepoNFT",
                                    "decimals": 0,
                                    "type": "EIP-004"
                                },
                                {
                                    "tokenId": "3c6cb596273a737c3e111c31d3ec868b84676b7bad82f9888ad574b44edef267",
                                    "index": 1,
                                    "amount": 99998,
                                    "name": "Cardano-RWT",
                                    "decimals": 0,
                                    "type": "EIP-004"
                                },
                                {
                                    "tokenId": "a2a6c892c38d508a659caf857dbe29da4343371e597efd42e40f9bc99099a516",
                                    "index": 2,
                                    "amount": 201,
                                    "name": "RSN",
                                    "decimals": 0,
                                    "type": "EIP-004"
                                }
                            ],
                            "additionalRegisters": {
                                "R4": {
                                    "serializedValue": "1a030341444120e7e510a1efceaba04926a23135caec8d28d8f5564c9f6a1e162a5415bf344b4020f8685c0397fbe7a7684324d678930830924d1d0954e433ae06fa988d998ab7e7",
                                    "sigmaType": "Coll[Coll[SByte]]",
                                    "renderedValue": "[414441,e7e510a1efceaba04926a23135caec8d28d8f5564c9f6a1e162a5415bf344b40,f8685c0397fbe7a7684324d678930830924d1d0954e433ae06fa988d998ab7e7]"
                                },
                                "R5": {
                                    "serializedValue": "1103000202",
                                    "sigmaType": "Coll[SLong]",
                                    "renderedValue": "[0,1,1]"
                                },
                                "R6": {
                                    "serializedValue": "1104c80166009e9c01",
                                    "sigmaType": "Coll[SLong]",
                                    "renderedValue": "[100,51,0,9999]"
                                },
                                "R7": {
                                    "serializedValue": "0406",
                                    "sigmaType": "SInt",
                                    "renderedValue": "3"
                                }
                            }
                        },
                        {
                            "boxId": "2b0ec40d760a927fcffda6d2cdc7f565855ef15f493dd5af02def73885db216b",
                            "value": 89000000,
                            "index": 1,
                            "spendingProof": "bca71224da33c5a8ac1ebfccb84f70e9516073ef2257163734d4fa5cfcdeefba538baee24909d78b60c3e736da3ee4544c152a1b8f2260c8",
                            "outputBlockId": "28c42900f573326fcd77ed7fefd8ee3d89c3b4212e1ccc7f97c4c994ae9cbdc4",
                            "outputTransactionId": "cd847939a0a22e2042be88e2bb7f547c742ea723da3d91563fdc978928255cb4",
                            "outputIndex": 1,
                            "ergoTree": "0008cd02a2ad492651dce79889f687c8557c10312cb74294bf9c34b015672e83f88a399a",
                            "address": "9fkhssxhaXbJgSqJZn18tdobRDuhEm2VMBrhxEVmzLuTcFHWxXF",
                            "assets": [
                                {
                                    "tokenId": "a2a6c892c38d508a659caf857dbe29da4343371e597efd42e40f9bc99099a516",
                                    "index": 0,
                                    "amount": 100,
                                    "name": "RSN",
                                    "decimals": 0,
                                    "type": "EIP-004"
                                },
                                {
                                    "tokenId": "3d33c0b2e22c189705cb05e433fbb1ccc9d80d70ea804bde9d31f174c72c9a23",
                                    "index": 1,
                                    "amount": 1,
                                    "name": null,
                                    "decimals": null,
                                    "type": null
                                }
                            ],
                            "additionalRegisters": {}
                        }
                    ],
                    "dataInputs": [],
                    "outputs": [
                        {
                            "boxId": "906d389a39c914a393cb06c0ab7557d04b58f7e9e73284aac520d08e7dd46a82",
                            "transactionId": "a52262ecb452c8a0919b4e571fab2abfa69787bae07a9a9d081821740d4ee7cf",
                            "value": 1100000,
                            "index": 0,
                            "creationHeight": 217656,
                            "ergoTree": "101c040204000e20a6ac381e6fa99929fd1477b3ba9499790a775e91d4c14c5aa86e9a118dfac8530101040204000402040404040400040004020402040204000400040004000e2013fe3ae277a195b83048e3e268529118fa4c18cca0931e3b48a8f5fccec75bc9040404000400040204020400040004000400d801d601b2a473000095938cb2db63087201730100017302d17303d811d602db6308a7d603b27202730400d6048c720302d605b2a5730500d606db63087205d607b27206730600d6088c720702d609e4c6a70511d60ab17209d60be4c672050511d60cb1720bd60de4c6a70611d60eb27206730700d60f8c720e02d610b27202730800d6118c721002d6129683050193c27205c2a793e4c672050611720d938cb27206730900018cb27202730a0001938c7207018c720301938c720e018c721001959172047208d806d613e4c67205041ad6149a720a730bd61599720c730cd616c5a7d6179972047208d618b2a5730d00d196830c01721293b17213721493b47213730e7215e4c6a7041a93b27213721500721693720c721493b4720b730f7215720993b2720b7215007217939c7217b2720d73100099720f7211938cb2db6308721873110002721793cbc27218731293e4c67218041a83010e7216938cb2db6308b2a5731300731400017216d804d613e4c6a7041ad614e4c672050704d6159972087204d616b27209721400d19683040172129383010eb27213721400e4c67201041a939c7215b2720d731500997211720f959172167215968302019372169ab2720b7214007215937213e4c67205041ad803d617e4c67205041ad6189a72147316d61999720a731796830501937216721593b4721373187214b472177319721493b472137218720ab472177214721993b47209731a7214b4720b731b721493b472097218720ab4720b72147219",
                            "address": "N9nHZxAm7Z476Nbw6yF2X6BQEct7nNCm4SJeCK8DJEkERj6LXMJvKqG49WWSfNDufuuFEtN8msfWDd8UR4QUCmLEwFRWXC5hxEdk1XhdRSgiwuqyiPqpSTXtqUgGf67uCzEtHtN5nQKKuRYyr6xfFfV8YXKhms5JVqhmCM9869Nr4KzmLAdSLqwG6LswnFwRWwZZfC6Jf65RKV4xV5GTDqL5Ppc2QwnGDYFEUPPgLdskLbDAgwfDgE2mZnCfovUGmCjinh8UD1tW3AKfBPjFJbdF6eST8SB7EpDt162cZu7992Gaa3jNYwYnJKGKqU1izwb2WRVC3yXSHFQxr8GkTa3uQ9WAL1hyMSSNg7GqzF5a8GXFUTCw97zXUevKjtBAKxmjLQTfsmDdzYTe1oBNXEgffhVndtxhCfViYbnHVHUqEv8NQA8xiZaEzj9eCfrYyPepiq1sRruFwgjqhqhpetrQaKcSXmFjeFzCHnDR3aAV9dXQr6SyqAf7p7ML9H4rYNhLJAc4Usbuq8rVH8ysmTZPb7erhWmKXG8yFWqc6mE6tekXUuyvPhh3uXJWZgc6Z2RDbDNRvZNkxbUMDEDfb3iLtcNd3wGGLFndzryQNft8FZS4xwaskVZFQkFga3dfCgkMv3NAXrRTPmrDYD2WgurR8PfewJAJ2nu4GpMJadgTkkkLYvgrVxC8jp3w39dXzSCKAcQ7cGWyvYW6HK1s1VcG9QiogDf6YhM5mfroCCn6HweQ7hDdYtRvSyuDBVaZAJmhxKBffsGsApKocqPeZMjo8hsRr3bWgJA2xBhzxn42HCgDf2qULBH4b9HN5N3hyR7WURyVr9Y1vXwFTakEtMsr861X88mi2yUi7aqRh3XAFoN11Do9N34UPSzreELFk3SCxJT4uAdsKQrCm5yRo1zt5Mgh4tpHfgk4SsY7",
                            "assets": [
                                {
                                    "tokenId": "a40b86c663fbbfefa243c9c6ebbc5690fc4e385f15b44c49ba469c91c5af0f48",
                                    "index": 0,
                                    "amount": 1,
                                    "name": "RepoNFT",
                                    "decimals": 0,
                                    "type": "EIP-004"
                                },
                                {
                                    "tokenId": "3c6cb596273a737c3e111c31d3ec868b84676b7bad82f9888ad574b44edef267",
                                    "index": 1,
                                    "amount": 99997,
                                    "name": "Cardano-RWT",
                                    "decimals": 0,
                                    "type": "EIP-004"
                                },
                                {
                                    "tokenId": "a2a6c892c38d508a659caf857dbe29da4343371e597efd42e40f9bc99099a516",
                                    "index": 2,
                                    "amount": 301,
                                    "name": "RSN",
                                    "decimals": 0,
                                    "type": "EIP-004"
                                }
                            ],
                            "additionalRegisters": {
                                "R4": {
                                    "serializedValue": "1a040341444120e7e510a1efceaba04926a23135caec8d28d8f5564c9f6a1e162a5415bf344b4020f8685c0397fbe7a7684324d678930830924d1d0954e433ae06fa988d998ab7e720d1907f8d9b649ab27eaba1f5788ff22a0ab5e5ae37187bc8c0ee32dccfc74c6d",
                                    "sigmaType": "Coll[Coll[SByte]]",
                                    "renderedValue": "[414441,e7e510a1efceaba04926a23135caec8d28d8f5564c9f6a1e162a5415bf344b40,f8685c0397fbe7a7684324d678930830924d1d0954e433ae06fa988d998ab7e7,d1907f8d9b649ab27eaba1f5788ff22a0ab5e5ae37187bc8c0ee32dccfc74c6d]"
                                },
                                "R5": {
                                    "serializedValue": "110400020202",
                                    "sigmaType": "Coll[SLong]",
                                    "renderedValue": "[0,1,1,1]"
                                },
                                "R6": {
                                    "serializedValue": "1104c80166009e9c01",
                                    "sigmaType": "Coll[SLong]",
                                    "renderedValue": "[100,51,0,9999]"
                                },
                                "R7": {
                                    "serializedValue": "0400",
                                    "sigmaType": "SInt",
                                    "renderedValue": "0"
                                }
                            },
                            "spentTransactionId": null
                        },
                        {
                            "boxId": "fe27e70a073921f0a154ea96d623fe1414188ccf7acacb5210c037f63751807d",
                            "transactionId": "a52262ecb452c8a0919b4e571fab2abfa69787bae07a9a9d081821740d4ee7cf",
                            "value": 1100000,
                            "index": 1,
                            "creationHeight": 217656,
                            "ergoTree": "10130400040004040400040204000e20a40b86c663fbbfefa243c9c6ebbc5690fc4e385f15b44c49ba469c91c5af0f480404040004000400010104020400040004000e20872fee02938af6c93dff43049ec61b379e75c059b05f39304b3f1ce50cf3ad9305020101d807d601b2a5730000d6028cb2db6308a773010001d603aeb5b4a57302b1a5d901036391b1db630872037303d9010363aedb63087203d901054d0e938c7205017202d604e4c6a7041ad605b2a5730400d606db63087205d607ae7206d901074d0e938c720701720295938cb2db63087201730500017306d196830301ef7203938cb2db6308b2a473070073080001b2720473090095720796830201938cb27206730a0001720293c27205c2a7730bd801d608c2a7d196830501ef720393c27201720893e4c67201041a7204938cb2db6308b2a4730c00730d0001b27204730e00957207d801d609b27206730f0096830701938c720901720293cbc272057310e6c67205051ae6c67205060e93e4c67205070ecb720893e4c67205041a7204938c72090273117312",
                            "address": "EE7687i4URb4YuSGSQXPCbAjMfN4dUt5Qx8BqKZJiZhDY8fdnSUwcAGqAsqfn1tW1byXB8nDrgkFzkAFgaaempKxfcPtE1W4ZA6mbFZohS4qMVYjUTQNhcZh3XPmgrKLCHqSJBmZTzkr3DQVzvo1YYSpfwPSHeomitjSFC4iS9N71YR6SbNXYPTFSjTPZTgxs7S2hBTrk7FsYXXe3EnVmnnEA8p1EZ5MBhLWBRgdBLGMuVUwPUeVEHszKmLHfqSkN7bnCAgrCaNbg1gZAPfmxgyLLYZJNS4NqpoYZogancR9hRk2D6FBncc81A3vNMrGWKmVFctX9cJNiFH7yvK1sdJekgVRazZnu9KRbKe61kUZToAfNAWcskHDNgex7t5k61pr2vjENf3L64o7WiaqVGaky5QmFvZuRBdw3fwx4F84zVNrpBjB7AsBnJb7ZCeFBq7rDCaBvZdnM9m2WNVkcZYEkmvgqSg1KV6DAVRWK85dkLaEgf4zyDqV9N6aG7iWExPeAMetGF6k2n89s6TZvtq99TqbW8T7tCLkn4B",
                            "assets": [
                                {
                                    "tokenId": "3c6cb596273a737c3e111c31d3ec868b84676b7bad82f9888ad574b44edef267",
                                    "index": 0,
                                    "amount": 1,
                                    "name": "Cardano-RWT",
                                    "decimals": 0,
                                    "type": "EIP-004"
                                }
                            ],
                            "additionalRegisters": {
                                "R4": {
                                    "serializedValue": "1a0120d1907f8d9b649ab27eaba1f5788ff22a0ab5e5ae37187bc8c0ee32dccfc74c6d",
                                    "sigmaType": "Coll[Coll[SByte]]",
                                    "renderedValue": "[d1907f8d9b649ab27eaba1f5788ff22a0ab5e5ae37187bc8c0ee32dccfc74c6d]"
                                },
                                "R5": {
                                    "serializedValue": "0e0100",
                                    "sigmaType": "Coll[SByte]",
                                    "renderedValue": "00"
                                }
                            },
                            "spentTransactionId": null
                        },
                        {
                            "boxId": "281ba1d668e1266e7e2efaf4f56120ecf1808adedee93a84ce0ff27d8df319d2",
                            "transactionId": "a52262ecb452c8a0919b4e571fab2abfa69787bae07a9a9d081821740d4ee7cf",
                            "value": 86800000,
                            "index": 2,
                            "creationHeight": 217656,
                            "ergoTree": "0008cd02a2ad492651dce79889f687c8557c10312cb74294bf9c34b015672e83f88a399a",
                            "address": "9fkhssxhaXbJgSqJZn18tdobRDuhEm2VMBrhxEVmzLuTcFHWxXF",
                            "assets": [
                                {
                                    "tokenId": "d1907f8d9b649ab27eaba1f5788ff22a0ab5e5ae37187bc8c0ee32dccfc74c6d",
                                    "index": 0,
                                    "amount": 1,
                                    "name": null,
                                    "decimals": null,
                                    "type": null
                                }
                            ],
                            "additionalRegisters": {},
                            "spentTransactionId": null
                        },
                        {
                            "boxId": "16543e194fd568410c0936bae12b30a9b668c0baa4bc769068b2ba76fee86f53",
                            "transactionId": "a52262ecb452c8a0919b4e571fab2abfa69787bae07a9a9d081821740d4ee7cf",
                            "value": 1100000,
                            "index": 3,
                            "creationHeight": 217656,
                            "ergoTree": "1005040004000e36100204a00b08cd0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798ea02d192a39a8cc7a701730073011001020402d19683030193a38cc7b2a57300000193c2b2a57301007473027303830108cdeeac93b1a57304",
                            "address": "2iHkR7CWvD1R4j1yZg5bkeDRQavjAaVPeTDFGGLZduHyfWMuYpmhHocX8GJoaieTx78FntzJbCBVL6rf96ocJoZdmWBL2fci7NqWgAirppPQmZ7fN9V6z13Ay6brPriBKYqLp1bT2Fk4FkFLCfdPpe",
                            "assets": [],
                            "additionalRegisters": {},
                            "spentTransactionId": null
                        }
                    ],
                    "size": 1683
                }
            ],
            "total": 1
        }`,

    last10BlockHeaders: [{
        "extensionId": "27143b3ad6607ca59fc6b882a96d999c1147dbedb4caa3c945208318feb6ef76",
        "difficulty": "5635571712",
        "votes": "000000",
        "timestamp": 1653932558503,
        "size": 221,
        "stateRoot": "b3e7d62d8c8d7d6ae38a69b2c369d307c2b41d01f21a313bd4b98345a1551e9516",
        "height": 215806,
        "nBits": 83972072,
        "version": 2,
        "id": "9dbe11053b952358e555451169ec9df7f0583bd80e822c0e8a71907edc3fe9af",
        "adProofsRoot": "4087e5f27842be6105e553d8f7a29a75ad59a04884014d5634bab29b68f6985c",
        "transactionsRoot": "87a0d482a763d1933edff775e469f8e0f618d1bbc0a3dbaf14e98a9538908c8f",
        "extensionHash": "29a8cd654991d2cfac09c9e78b1f58730ff3577ad0afd42f13b58e47a62f7277",
        "powSolutions": {
            "pk": "03702266cae8daf75b7f09d4c23ad9cdc954849ee280eefae0d67bd97db4a68f6a",
            "w": "0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798",
            "n": "00000000b7f19562",
            "d": 0
        },
        "adProofsId": "cb91890c525e1f13b84bf5af7178c6dfc55125f3b6a7b16f3891064a8434d717",
        "transactionsId": "7986444f8f181172e32272df7e7d1bd1fab520f024230802f6bde38c77262b5e",
        "parentId": "8718e93fa6ea4ec8b3f955b654acf0d6f594e1420df2da4907b8c2eebdecc686"
    },
        {
            "extensionId": "e04c61992a27ce4ebe82809f94b8290c078397830a24779908ddd52cd092c6f5",
            "difficulty": "5635571712",
            "votes": "000000",
            "timestamp": 1653932631795,
            "size": 221,
            "stateRoot": "7e56555ce442061f504f92047579f9afef9b2acb259edd56e419dfcecc5df4e716",
            "height": 215807,
            "nBits": 83972072,
            "version": 2,
            "id": "4fdbd7ec22ec03477b5b4cb04239c8b30f6f95ac7a3add388cb5a1eae993d2b1",
            "adProofsRoot": "73cf773ab227ce9b74960397616c9fd89d57bb857c8eac912c0c3d2773e9412b",
            "transactionsRoot": "b0e5ca1a2ebeda25087cd601f51485103b12a3dd4492c47419b52c1684738b78",
            "extensionHash": "29a8cd654991d2cfac09c9e78b1f58730ff3577ad0afd42f13b58e47a62f7277",
            "powSolutions": {
                "pk": "03702266cae8daf75b7f09d4c23ad9cdc954849ee280eefae0d67bd97db4a68f6a",
                "w": "0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798",
                "n": "0000000381e364f9",
                "d": 0
            },
            "adProofsId": "2ca8e8de7ca57ca155476cd83314f2e11d61d058baec7951fad80d98523f560d",
            "transactionsId": "e2e6ecb25b549ab3ebff505c3cf4a356a4df3b3f869fbc9082018cead4fa141f",
            "parentId": "9dbe11053b952358e555451169ec9df7f0583bd80e822c0e8a71907edc3fe9af"
        },
        {
            "extensionId": "ef8ac46dbcfdcb0fe04fda74f6d206f92a0235be1c4643f7e5bc901d7ddae079",
            "difficulty": "5635571712",
            "votes": "000000",
            "timestamp": 1653932970497,
            "size": 221,
            "stateRoot": "e3256897e8d264de11a7a2dbde246602d6d89c63c9c3d17dab67b6d5de5b32c816",
            "height": 215808,
            "nBits": 83972072,
            "version": 2,
            "id": "7acaca47daadf829438baa14b32f2fcd026937636b6fcd3d05e40d3c43215e46",
            "adProofsRoot": "32e49ee8e06bac632a71b20649d6a226f9a916103991d5664d5fa76ea73e1da8",
            "transactionsRoot": "7d758d1ceec75791f11171483c3d2703b047d38ce52e7470662613031e9fb313",
            "extensionHash": "9c77092d2e63fdf246cd894527c185947bfea37e6511665dba16a1f9790673fa",
            "powSolutions": {
                "pk": "03702266cae8daf75b7f09d4c23ad9cdc954849ee280eefae0d67bd97db4a68f6a",
                "w": "0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798",
                "n": "000000026912218c",
                "d": 0
            },
            "adProofsId": "bcd7a97e0e5b51be17204c16168d37310d17e43bb3242753f92e2a463619f9e4",
            "transactionsId": "54319ad6b9f7ca7b3d9f8d467fe31e56d65841cc24e983a300a4fcf89b2c5888",
            "parentId": "4fdbd7ec22ec03477b5b4cb04239c8b30f6f95ac7a3add388cb5a1eae993d2b1"
        },
        {
            "extensionId": "b08fef096a9cf24bad3a7e7e049b6b812ca43b51795e4a643591e05ec2f0196f",
            "difficulty": "5090705408",
            "votes": "000000",
            "timestamp": 1653933205053,
            "size": 220,
            "stateRoot": "e318a25a13dfd14ae41e3820097c33b7d49e8b9bc479d13c93a8d98601588fd316",
            "height": 215809,
            "nBits": 83963758,
            "version": 2,
            "id": "f91cdc031f9ab8451b39a3b292781325cd3941393e1967319df4c5e593daa593",
            "adProofsRoot": "37d2632b0092dae168e0bccc5192173f12c7d43e631b0f9c4d4bb76d34b0502f",
            "transactionsRoot": "226640250d9c7e4f317da15ab2b05c96f70dfc387ac3be2b79917592c24dea29",
            "extensionHash": "e8d3674f5f14dd2f1eced0aa1f74e23a3294dc62bbd018c349666dcf5de38bad",
            "powSolutions": {
                "pk": "03702266cae8daf75b7f09d4c23ad9cdc954849ee280eefae0d67bd97db4a68f6a",
                "w": "0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798",
                "n": "000000017bd52182",
                "d": 0
            },
            "adProofsId": "714677588ae780b6b432e8f53e5d6b0399506a7eda24e300199df9c62de32198",
            "transactionsId": "3a13afd7c9c6d54f5c888213bc88311d75feef789664902155770d605c01eca2",
            "parentId": "7acaca47daadf829438baa14b32f2fcd026937636b6fcd3d05e40d3c43215e46"
        },
        {
            "extensionId": "a91cbd4ff37c5c29e01c36524a24d6f54b3f97396080b8c5d782650104b952d8",
            "difficulty": "5090705408",
            "votes": "000000",
            "timestamp": 1653933351656,
            "size": 220,
            "stateRoot": "022494222deea6d3fa1145a27b5782f383e01cc96555e28a2bd7a11187d87a5816",
            "height": 215810,
            "nBits": 83963758,
            "version": 2,
            "id": "c3abfe4d6bad9f19a84c11a7dda4e7b0cca1e4aa42f50f34f395f8a6f898d622",
            "adProofsRoot": "ae47944cf48005cc54caa538bbcee25480f0c82a8bb0dd23ca92a9a481cb6ce7",
            "transactionsRoot": "b34ec763e862304f470373d6556f0c0e4fd9e14e5ba8f542d350ea9c29e850f3",
            "extensionHash": "e8d3674f5f14dd2f1eced0aa1f74e23a3294dc62bbd018c349666dcf5de38bad",
            "powSolutions": {
                "pk": "03702266cae8daf75b7f09d4c23ad9cdc954849ee280eefae0d67bd97db4a68f6a",
                "w": "0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798",
                "n": "00000000d2fbb6d3",
                "d": 0
            },
            "adProofsId": "58ff7896d75c302420c2b52ced0d8a3750a4b747824ba181765cb6f8861863f1",
            "transactionsId": "1766ccdd64d8601403c1262bd187db9ebb26dc5adb9ae7100ef92c24472763fa",
            "parentId": "f91cdc031f9ab8451b39a3b292781325cd3941393e1967319df4c5e593daa593"
        },
        {
            "extensionId": "9bdebff276f7cf8051ee9f217bcd319f30b1befb9098f2343652a90a7c635039",
            "difficulty": "5090705408",
            "votes": "000000",
            "timestamp": 1653933434918,
            "size": 220,
            "stateRoot": "4277cabc6bff122c93b7f4f84924733c38278c5a739c0e538452e670dd1e838816",
            "height": 215811,
            "nBits": 83963758,
            "version": 2,
            "id": "75a8f5b78624bb5eb4f8e3ac702f80eb10d3a05feeb50d1c8e1e7e17f8fb61b3",
            "adProofsRoot": "0f193db5aacec6ef6d85177100244b12415b80f196964f523338b6c6a0140247",
            "transactionsRoot": "ece2b525d82bd7620ccd8e6c79bf6a56ca22bdafe830e22022dd8bbbc9f946fa",
            "extensionHash": "66c134df905d7d1d263ebe638d97d384af93ba592954d55fc865b9e54eef70f2",
            "powSolutions": {
                "pk": "03702266cae8daf75b7f09d4c23ad9cdc954849ee280eefae0d67bd97db4a68f6a",
                "w": "0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798",
                "n": "00000000202e9454",
                "d": 0
            },
            "adProofsId": "139cf63bd95bf0068c6dedc1f22b3925b37256b3401d4db0dbbb58e8fe391626",
            "transactionsId": "ae6e3aca91077dbb894e0e0f2b136049d8ba2791958a5df932dbb654d2f6f034",
            "parentId": "c3abfe4d6bad9f19a84c11a7dda4e7b0cca1e4aa42f50f34f395f8a6f898d622"
        },
        {
            "extensionId": "3396ffe01e400d4eda6f51745e901f1b22b5b75c7a4da209426de9450d7c2f32",
            "difficulty": "5090705408",
            "votes": "000000",
            "timestamp": 1653933451736,
            "size": 220,
            "stateRoot": "c216821348f1fe154902da75a97c6861e061fa4cb0d84de1ebd27b994bba71ef16",
            "height": 215812,
            "nBits": 83963758,
            "version": 2,
            "id": "b40264ee73987b5919b40f679d4a23cb52aad5d3e9b9f052e76ab2f4c2e03c08",
            "adProofsRoot": "4a8acc9bf0ccc863c0a4c973ccd60dfab47e4548b139069cf0963b2216e7300f",
            "transactionsRoot": "a84c2e3e3b8191783f887d8ab61e3982e011da21a69f658f78e1e561ca589bb7",
            "extensionHash": "92f4f29731ee9bd01d8d39d1256dc7b55a03cef7f8e445f12afe74705517985c",
            "powSolutions": {
                "pk": "03702266cae8daf75b7f09d4c23ad9cdc954849ee280eefae0d67bd97db4a68f6a",
                "w": "0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798",
                "n": "0000000094978b6a",
                "d": 0
            },
            "adProofsId": "5b2d299f412b8066b16e9b3cf9f6e1de2c62302db25bda1346f7ccefaf0d6d9e",
            "transactionsId": "b7035ad8507fac49f46e14fc2e414239474ad045f29b6f198b565dec77639602",
            "parentId": "75a8f5b78624bb5eb4f8e3ac702f80eb10d3a05feeb50d1c8e1e7e17f8fb61b3"
        },
        {
            "extensionId": "1ad0f5ea4d0249da84cef643b07ebb499a09d6a08e115ec35d521bcceb668f7e",
            "difficulty": "5090705408",
            "votes": "000000",
            "timestamp": 1653933511999,
            "size": 220,
            "stateRoot": "85ee11729ac50ad30eb4cd5937f10e1453eec800fbea6276c76e9b0b10da551f16",
            "height": 215813,
            "nBits": 83963758,
            "version": 2,
            "id": "07c4231ad059271f87926baba27ffc59cc9df23b3bb74bbfc958e1e267e55657",
            "adProofsRoot": "3d26bf3d3a77f7c3cd79c70bdad0233b26f20ffc7799c1797397995917d4c941",
            "transactionsRoot": "1b0fdd82251cdd998868c44ff247b1f3309aee4f7685bef57d4815883f0974cf",
            "extensionHash": "92f4f29731ee9bd01d8d39d1256dc7b55a03cef7f8e445f12afe74705517985c",
            "powSolutions": {
                "pk": "03702266cae8daf75b7f09d4c23ad9cdc954849ee280eefae0d67bd97db4a68f6a",
                "w": "0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798",
                "n": "000000008c46fe39",
                "d": 0
            },
            "adProofsId": "6979d03b995a191e2aff734e1b12c44b4852ab782260b1da21f1ec0473cbb09e",
            "transactionsId": "2b64466b904e59552d5796e99b0428b24e85a79da180d5b4ca4d9f05289dc562",
            "parentId": "b40264ee73987b5919b40f679d4a23cb52aad5d3e9b9f052e76ab2f4c2e03c08"
        },
        {
            "extensionId": "ae51baeb1dd8f68fc9bc5c5d7ddfe227fc1a453045ce5704d2f57b5f7d5c0f9d",
            "difficulty": "5090705408",
            "votes": "000000",
            "timestamp": 1653933569225,
            "size": 220,
            "stateRoot": "870b8cc02f42360bef9766dc42c58a7eac71a12ef186e8b6498b859b304c835516",
            "height": 215814,
            "nBits": 83963758,
            "version": 2,
            "id": "2aeed311b23c92427c16f2262bde3396484e109fcddb4f1a56aa1dd5a7b2113b",
            "adProofsRoot": "c4cd0df1ee4cad41a010732e21ffd0d073bde060145c640b31aac508a4668594",
            "transactionsRoot": "935b773457cb4065b7947bc1600b8849707cd70f9f8ca4520adc288f2d4a3d80",
            "extensionHash": "c5556727874b10550de7a90240f1bbe9d1e1dcef5741e34d93b73d592a2b4c93",
            "powSolutions": {
                "pk": "03702266cae8daf75b7f09d4c23ad9cdc954849ee280eefae0d67bd97db4a68f6a",
                "w": "0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798",
                "n": "0000000085faadb5",
                "d": 0
            },
            "adProofsId": "de0e6fa550cbf280f0fdf01aca7ae06acc4ee6944073080d822ff2346a2d7098",
            "transactionsId": "fa989159c28706c7700cc9f09dc215e4c7da17343fd5b12bd2473921ff2bbc3f",
            "parentId": "07c4231ad059271f87926baba27ffc59cc9df23b3bb74bbfc958e1e267e55657"
        },
        {
            "extensionId": "a5d21ffb6ba8a35c3b5450d6ccb9eb2073cd588a57bdcaa4a767199e74d83576",
            "difficulty": "5090705408",
            "votes": "000000",
            "timestamp": 1653933624717,
            "size": 220,
            "stateRoot": "364c459ee947d41d618411a398b0fb4ed77e2d5188727ff3abc8476f45defc4116",
            "height": 215815,
            "nBits": 83963758,
            "version": 2,
            "id": "98ed9df1f0f54d18180fb8957ee364e1e94b68ded4fc55eb52d15a56dbb7e53d",
            "adProofsRoot": "82a0c03bab1d69677ffa5ce2b180b37bd461e34239e036f0f21cbc9eb515afa9",
            "transactionsRoot": "5d0d691a780bd078d21b6484d4f72b91a8f70d553b25546938bd16831f27f3d9",
            "extensionHash": "c5556727874b10550de7a90240f1bbe9d1e1dcef5741e34d93b73d592a2b4c93",
            "powSolutions": {
                "pk": "03702266cae8daf75b7f09d4c23ad9cdc954849ee280eefae0d67bd97db4a68f6a",
                "w": "0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798",
                "n": "00000000aa7f2207",
                "d": 0
            },
            "adProofsId": "58679314a2d9d6432c34577787701555a4ed778574b877d1e4c23c12f09600a9",
            "transactionsId": "2ac59a2e809aa9f92ea8106aea9de46822a80758d5899f337dac1baf19215ee3",
            "parentId": "2aeed311b23c92427c16f2262bde3396484e109fcddb4f1a56aa1dd5a7b2113b"
        }],

    networkInfo:
        `{
        "currentTime": 1653933395496,
        "network": "mainnet",
        "name": "ergo-main",
        "stateType": "utxo",
        "difficulty": 5090705408,
        "bestFullHeaderId": "f91cdc031f9ab8451b39a3b292781325cd3941393e1967319df4c5e593daa593",
        "bestHeaderId": "f91cdc031f9ab8451b39a3b292781325cd3941393e1967319df4c5e593daa593",
        "peersCount": 1,
        "unconfirmedCount": 0,
        "appVersion": "4.0.23-0-60bcda53-20220207-0921-SNAPSHOT",
        "stateRoot": "e318a25a13dfd14ae41e3820097c33b7d49e8b9bc479d13c93a8d98601588fd316",
        "genesisBlockId": "43d0ead059054f29ca9c831c93613e1ca98e8fbbc8b166c4fa24120a9d489824",
        "previousFullHeaderId": "7acaca47daadf829438baa14b32f2fcd026937636b6fcd3d05e40d3c43215e46",
        "fullHeight": 215809,
        "headersHeight": 215809,
        "stateVersion": "f91cdc031f9ab8451b39a3b292781325cd3941393e1967319df4c5e593daa593",
        "fullBlocksScore": 830709701325856,
        "launchTime": 1648460016914,
        "lastSeenMessageTime": 1653933376350,
        "headersScore": 830709701325856,
        "parameters": {
            "outputCost": 100,
            "tokenAccessCost": 100,
            "maxBlockCost": 1000000,
            "height": 215808,
            "maxBlockSize": 524288,
            "dataInputCost": 100,
            "blockVersion": 2,
            "inputCost": 2000,
            "storageFeeFactor": 1250000,
            "minValuePerByte": 360
        },
        "isMining": true
    }
`,

    firstWatcherLastUnspentBox:
        `{
        "items": [
            {
                "boxId": "296ee327c6ba272de7b034fff40c384c95137886336515eecdd3e1ddf51e62ec",
                "transactionId": "41e53a677d1830625b5d7a3dc91f9bd576fc1b2d4c166df064b7404b23e56eac",
                "blockId": "2e4cb3a1ae112773687eadda98130bb3cdfe2292852b4eb345c5ecb543070722",
                "value": 100000000,
                "index": 0,
                "globalIndex": 472658,
                "creationHeight": 215968,
                "settlementHeight": 215970,
                "ergoTree": "0008cd03c880d703131f301badf289ceb9b7f86d674e8cbe390461f66e844f507571a1d6",
                "address": "9hz7H7bxzcEYLd333TocbEHawk7YKzdCgCg1PAaQVUWG83tghQL",
                "assets": [
                    {
                        "tokenId": "a2a6c892c38d508a659caf857dbe29da4343371e597efd42e40f9bc99099a516",
                        "index": 0,
                        "amount": 1000,
                        "name": "RSN",
                        "decimals": 0,
                        "type": "EIP-004"
                    }
                ],
                "additionalRegisters": {},
                "spentTransactionId": null,
                "mainChain": true
            }
        ],
        "total": 1
    }
`,

    firstWatcherLast10UnspentBoxes:
        `{
        "items": [
            {
                "boxId": "296ee327c6ba272de7b034fff40c384c95137886336515eecdd3e1ddf51e62ec",
                "transactionId": "41e53a677d1830625b5d7a3dc91f9bd576fc1b2d4c166df064b7404b23e56eac",
                "blockId": "2e4cb3a1ae112773687eadda98130bb3cdfe2292852b4eb345c5ecb543070722",
                "value": 100000000,
                "index": 0,
                "globalIndex": 472658,
                "creationHeight": 215968,
                "settlementHeight": 215970,
                "ergoTree": "0008cd03c880d703131f301badf289ceb9b7f86d674e8cbe390461f66e844f507571a1d6",
                "address": "9hz7H7bxzcEYLd333TocbEHawk7YKzdCgCg1PAaQVUWG83tghQL",
                "assets": [
                    {
                        "tokenId": "a2a6c892c38d508a659caf857dbe29da4343371e597efd42e40f9bc99099a516",
                        "index": 0,
                        "amount": 1000,
                        "name": "RSN",
                        "decimals": 0,
                        "type": "EIP-004"
                    }
                ],
                "additionalRegisters": {},
                "spentTransactionId": null,
                "mainChain": true
            }
        ],
        "total": 1
    }
`,

    watcherPermitLastBox:
        `{
        "items": [
            {
                "boxId": "b56c1c51234dcaa9bfdc46db052dae1b0b53ea77b87fe9f4ed2c8a24994fb42c",
                "transactionId": "dc84702d37d98367149572e1e01361c66e1b4f531ea7e0813b510e3fec91fbeb",
                "blockId": "0918e0d916d547902cf67ddab4020d12690ca558252871dd6f5c150dcd8dad2a",
                "value": 1100000,
                "index": 1,
                "globalIndex": 469393,
                "creationHeight": 214337,
                "settlementHeight": 214339,
                "ergoTree": "10130400040004040400040204000e20a40b86c663fbbfefa243c9c6ebbc5690fc4e385f15b44c49ba469c91c5af0f480404040004000400010104020400040004000e20872fee02938af6c93dff43049ec61b379e75c059b05f39304b3f1ce50cf3ad9305020101d807d601b2a5730000d6028cb2db6308a773010001d603aeb5b4a57302b1a5d901036391b1db630872037303d9010363aedb63087203d901054d0e938c7205017202d604e4c6a7041ad605b2a5730400d606db63087205d607ae7206d901074d0e938c720701720295938cb2db63087201730500017306d196830301ef7203938cb2db6308b2a473070073080001b2720473090095720796830201938cb27206730a0001720293c27205c2a7730bd801d608c2a7d196830501ef720393c27201720893e4c67201041a7204938cb2db6308b2a4730c00730d0001b27204730e00957207d801d609b27206730f0096830701938c720901720293cbc272057310e6c67205051ae6c67205060e93e4c67205070ecb720893e4c67205041a7204938c72090273117312",
                "address": "EE7687i4URb4YuSGSQXPCbAjMfN4dUt5Qx8BqKZJiZhDY8fdnSUwcAGqAsqfn1tW1byXB8nDrgkFzkAFgaaempKxfcPtE1W4ZA6mbFZohS4qMVYjUTQNhcZh3XPmgrKLCHqSJBmZTzkr3DQVzvo1YYSpfwPSHeomitjSFC4iS9N71YR6SbNXYPTFSjTPZTgxs7S2hBTrk7FsYXXe3EnVmnnEA8p1EZ5MBhLWBRgdBLGMuVUwPUeVEHszKmLHfqSkN7bnCAgrCaNbg1gZAPfmxgyLLYZJNS4NqpoYZogancR9hRk2D6FBncc81A3vNMrGWKmVFctX9cJNiFH7yvK1sdJekgVRazZnu9KRbKe61kUZToAfNAWcskHDNgex7t5k61pr2vjENf3L64o7WiaqVGaky5QmFvZuRBdw3fwx4F84zVNrpBjB7AsBnJb7ZCeFBq7rDCaBvZdnM9m2WNVkcZYEkmvgqSg1KV6DAVRWK85dkLaEgf4zyDqV9N6aG7iWExPeAMetGF6k2n89s6TZvtq99TqbW8T7tCLkn4B",
                "assets": [
                    {
                        "tokenId": "3c6cb596273a737c3e111c31d3ec868b84676b7bad82f9888ad574b44edef267",
                        "index": 0,
                        "amount": 1,
                        "name": "Cardano-RWT",
                        "decimals": 0,
                        "type": "EIP-004"
                    }
                ],
                "additionalRegisters": {
                    "R4": {
                        "serializedValue": "1a01204911d8b1e96bccba5cbbfe2938578b3b58a795156518959fcbfc3bd7232b35a8",
                        "sigmaType": "Coll[Coll[SByte]]",
                        "renderedValue": "[4911d8b1e96bccba5cbbfe2938578b3b58a795156518959fcbfc3bd7232b35a8]"
                    },
                    "R5": {
                        "serializedValue": "0e0100",
                        "sigmaType": "Coll[SByte]",
                        "renderedValue": "00"
                    }
                },
                "spentTransactionId": null,
                "mainChain": true
            }
        ],
        "total": 1
    }
`,

    watcherPermitLast10Boxes:
        `{
        "items": [
            {
                "boxId": "b56c1c51234dcaa9bfdc46db052dae1b0b53ea77b87fe9f4ed2c8a24994fb42c",
                "transactionId": "dc84702d37d98367149572e1e01361c66e1b4f531ea7e0813b510e3fec91fbeb",
                "blockId": "0918e0d916d547902cf67ddab4020d12690ca558252871dd6f5c150dcd8dad2a",
                "value": 1100000,
                "index": 1,
                "globalIndex": 469393,
                "creationHeight": 214337,
                "settlementHeight": 214339,
                "ergoTree": "10130400040004040400040204000e20a40b86c663fbbfefa243c9c6ebbc5690fc4e385f15b44c49ba469c91c5af0f480404040004000400010104020400040004000e20872fee02938af6c93dff43049ec61b379e75c059b05f39304b3f1ce50cf3ad9305020101d807d601b2a5730000d6028cb2db6308a773010001d603aeb5b4a57302b1a5d901036391b1db630872037303d9010363aedb63087203d901054d0e938c7205017202d604e4c6a7041ad605b2a5730400d606db63087205d607ae7206d901074d0e938c720701720295938cb2db63087201730500017306d196830301ef7203938cb2db6308b2a473070073080001b2720473090095720796830201938cb27206730a0001720293c27205c2a7730bd801d608c2a7d196830501ef720393c27201720893e4c67201041a7204938cb2db6308b2a4730c00730d0001b27204730e00957207d801d609b27206730f0096830701938c720901720293cbc272057310e6c67205051ae6c67205060e93e4c67205070ecb720893e4c67205041a7204938c72090273117312",
                "address": "EE7687i4URb4YuSGSQXPCbAjMfN4dUt5Qx8BqKZJiZhDY8fdnSUwcAGqAsqfn1tW1byXB8nDrgkFzkAFgaaempKxfcPtE1W4ZA6mbFZohS4qMVYjUTQNhcZh3XPmgrKLCHqSJBmZTzkr3DQVzvo1YYSpfwPSHeomitjSFC4iS9N71YR6SbNXYPTFSjTPZTgxs7S2hBTrk7FsYXXe3EnVmnnEA8p1EZ5MBhLWBRgdBLGMuVUwPUeVEHszKmLHfqSkN7bnCAgrCaNbg1gZAPfmxgyLLYZJNS4NqpoYZogancR9hRk2D6FBncc81A3vNMrGWKmVFctX9cJNiFH7yvK1sdJekgVRazZnu9KRbKe61kUZToAfNAWcskHDNgex7t5k61pr2vjENf3L64o7WiaqVGaky5QmFvZuRBdw3fwx4F84zVNrpBjB7AsBnJb7ZCeFBq7rDCaBvZdnM9m2WNVkcZYEkmvgqSg1KV6DAVRWK85dkLaEgf4zyDqV9N6aG7iWExPeAMetGF6k2n89s6TZvtq99TqbW8T7tCLkn4B",
                "assets": [
                    {
                        "tokenId": "3c6cb596273a737c3e111c31d3ec868b84676b7bad82f9888ad574b44edef267",
                        "index": 0,
                        "amount": 1,
                        "name": "Cardano-RWT",
                        "decimals": 0,
                        "type": "EIP-004"
                    }
                ],
                "additionalRegisters": {
                    "R4": {
                        "serializedValue": "1a01204911d8b1e96bccba5cbbfe2938578b3b58a795156518959fcbfc3bd7232b35a8",
                        "sigmaType": "Coll[Coll[SByte]]",
                        "renderedValue": "[4911d8b1e96bccba5cbbfe2938578b3b58a795156518959fcbfc3bd7232b35a8]"
                    },
                    "R5": {
                        "serializedValue": "0e0100",
                        "sigmaType": "Coll[SByte]",
                        "renderedValue": "00"
                    }
                },
                "spentTransactionId": null,
                "mainChain": true
            }
        ],
        "total": 1
    }
`,

    repoLastBox:
        `{
        "items": [
            {
                "boxId": "2420251b88745c325124fac2abb6f1d3c0f23db66dd5d561aae6767b41cb5350",
                "transactionId": "dc84702d37d98367149572e1e01361c66e1b4f531ea7e0813b510e3fec91fbeb",
                "blockId": "0918e0d916d547902cf67ddab4020d12690ca558252871dd6f5c150dcd8dad2a",
                "value": 1100000,
                "index": 0,
                "globalIndex": 469392,
                "creationHeight": 214337,
                "settlementHeight": 214339,
                "ergoTree": "101c040204000e20a6ac381e6fa99929fd1477b3ba9499790a775e91d4c14c5aa86e9a118dfac8530101040204000402040404040400040004020402040204000400040004000e2013fe3ae277a195b83048e3e268529118fa4c18cca0931e3b48a8f5fccec75bc9040404000400040204020400040004000400d801d601b2a473000095938cb2db63087201730100017302d17303d811d602db6308a7d603b27202730400d6048c720302d605b2a5730500d606db63087205d607b27206730600d6088c720702d609e4c6a70511d60ab17209d60be4c672050511d60cb1720bd60de4c6a70611d60eb27206730700d60f8c720e02d610b27202730800d6118c721002d6129683050193c27205c2a793e4c672050611720d938cb27206730900018cb27202730a0001938c7207018c720301938c720e018c721001959172047208d806d613e4c67205041ad6149a720a730bd61599720c730cd616c5a7d6179972047208d618b2a5730d00d196830c01721293b17213721493b47213730e7215e4c6a7041a93b27213721500721693720c721493b4720b730f7215720993b2720b7215007217939c7217b2720d73100099720f7211938cb2db6308721873110002721793cbc27218731293e4c67218041a83010e7216938cb2db6308b2a5731300731400017216d804d613e4c6a7041ad614e4c672050704d6159972087204d616b27209721400d19683040172129383010eb27213721400e4c67201041a939c7215b2720d731500997211720f959172167215968302019372169ab2720b7214007215937213e4c67205041ad803d617e4c67205041ad6189a72147316d61999720a731796830501937216721593b4721373187214b472177319721493b472137218720ab472177214721993b47209731a7214b4720b731b721493b472097218720ab4720b72147219",
                "address": "N9nHZxAm7Z476Nbw6yF2X6BQEct7nNCm4SJeCK8DJEkERj6LXMJvKqG49WWSfNDufuuFEtN8msfWDd8UR4QUCmLEwFRWXC5hxEdk1XhdRSgiwuqyiPqpSTXtqUgGf67uCzEtHtN5nQKKuRYyr6xfFfV8YXKhms5JVqhmCM9869Nr4KzmLAdSLqwG6LswnFwRWwZZfC6Jf65RKV4xV5GTDqL5Ppc2QwnGDYFEUPPgLdskLbDAgwfDgE2mZnCfovUGmCjinh8UD1tW3AKfBPjFJbdF6eST8SB7EpDt162cZu7992Gaa3jNYwYnJKGKqU1izwb2WRVC3yXSHFQxr8GkTa3uQ9WAL1hyMSSNg7GqzF5a8GXFUTCw97zXUevKjtBAKxmjLQTfsmDdzYTe1oBNXEgffhVndtxhCfViYbnHVHUqEv8NQA8xiZaEzj9eCfrYyPepiq1sRruFwgjqhqhpetrQaKcSXmFjeFzCHnDR3aAV9dXQr6SyqAf7p7ML9H4rYNhLJAc4Usbuq8rVH8ysmTZPb7erhWmKXG8yFWqc6mE6tekXUuyvPhh3uXJWZgc6Z2RDbDNRvZNkxbUMDEDfb3iLtcNd3wGGLFndzryQNft8FZS4xwaskVZFQkFga3dfCgkMv3NAXrRTPmrDYD2WgurR8PfewJAJ2nu4GpMJadgTkkkLYvgrVxC8jp3w39dXzSCKAcQ7cGWyvYW6HK1s1VcG9QiogDf6YhM5mfroCCn6HweQ7hDdYtRvSyuDBVaZAJmhxKBffsGsApKocqPeZMjo8hsRr3bWgJA2xBhzxn42HCgDf2qULBH4b9HN5N3hyR7WURyVr9Y1vXwFTakEtMsr861X88mi2yUi7aqRh3XAFoN11Do9N34UPSzreELFk3SCxJT4uAdsKQrCm5yRo1zt5Mgh4tpHfgk4SsY7",
                "assets": [
                    {
                        "tokenId": "a40b86c663fbbfefa243c9c6ebbc5690fc4e385f15b44c49ba469c91c5af0f48",
                        "index": 0,
                        "amount": 1,
                        "name": "RepoNFT",
                        "decimals": 0,
                        "type": "EIP-004"
                    },
                    {
                        "tokenId": "3c6cb596273a737c3e111c31d3ec868b84676b7bad82f9888ad574b44edef267",
                        "index": 1,
                        "amount": 99999,
                        "name": "Cardano-RWT",
                        "decimals": 0,
                        "type": "EIP-004"
                    },
                    {
                        "tokenId": "a2a6c892c38d508a659caf857dbe29da4343371e597efd42e40f9bc99099a516",
                        "index": 2,
                        "amount": 101,
                        "name": "RSN",
                        "decimals": 0,
                        "type": "EIP-004"
                    }
                ],
                "additionalRegisters": {
                    "R4": {
                        "serializedValue": "1a0203414441204911d8b1e96bccba5cbbfe2938578b3b58a795156518959fcbfc3bd7232b35a8",
                        "sigmaType": "Coll[Coll[SByte]]",
                        "renderedValue": "[414441,4911d8b1e96bccba5cbbfe2938578b3b58a795156518959fcbfc3bd7232b35a8]"
                    },
                    "R5": {
                        "serializedValue": "11020002",
                        "sigmaType": "Coll[SLong]",
                        "renderedValue": "[0,1]"
                    },
                    "R6": {
                        "serializedValue": "1104c80166009e9c01",
                        "sigmaType": "Coll[SLong]",
                        "renderedValue": "[100,51,0,9999]"
                    },
                    "R7": {
                        "serializedValue": "0400",
                        "sigmaType": "SInt",
                        "renderedValue": "0"
                    }
                },
                "spentTransactionId": null,
                "mainChain": true
            }
        ],
        "total": 1
    }
`,

    repoLast10Boxes:
        `{
        "items": [
            {
                "boxId": "2420251b88745c325124fac2abb6f1d3c0f23db66dd5d561aae6767b41cb5350",
                "transactionId": "dc84702d37d98367149572e1e01361c66e1b4f531ea7e0813b510e3fec91fbeb",
                "blockId": "0918e0d916d547902cf67ddab4020d12690ca558252871dd6f5c150dcd8dad2a",
                "value": 1100000,
                "index": 0,
                "globalIndex": 469392,
                "creationHeight": 214337,
                "settlementHeight": 214339,
                "ergoTree": "101c040204000e20a6ac381e6fa99929fd1477b3ba9499790a775e91d4c14c5aa86e9a118dfac8530101040204000402040404040400040004020402040204000400040004000e2013fe3ae277a195b83048e3e268529118fa4c18cca0931e3b48a8f5fccec75bc9040404000400040204020400040004000400d801d601b2a473000095938cb2db63087201730100017302d17303d811d602db6308a7d603b27202730400d6048c720302d605b2a5730500d606db63087205d607b27206730600d6088c720702d609e4c6a70511d60ab17209d60be4c672050511d60cb1720bd60de4c6a70611d60eb27206730700d60f8c720e02d610b27202730800d6118c721002d6129683050193c27205c2a793e4c672050611720d938cb27206730900018cb27202730a0001938c7207018c720301938c720e018c721001959172047208d806d613e4c67205041ad6149a720a730bd61599720c730cd616c5a7d6179972047208d618b2a5730d00d196830c01721293b17213721493b47213730e7215e4c6a7041a93b27213721500721693720c721493b4720b730f7215720993b2720b7215007217939c7217b2720d73100099720f7211938cb2db6308721873110002721793cbc27218731293e4c67218041a83010e7216938cb2db6308b2a5731300731400017216d804d613e4c6a7041ad614e4c672050704d6159972087204d616b27209721400d19683040172129383010eb27213721400e4c67201041a939c7215b2720d731500997211720f959172167215968302019372169ab2720b7214007215937213e4c67205041ad803d617e4c67205041ad6189a72147316d61999720a731796830501937216721593b4721373187214b472177319721493b472137218720ab472177214721993b47209731a7214b4720b731b721493b472097218720ab4720b72147219",
                "address": "N9nHZxAm7Z476Nbw6yF2X6BQEct7nNCm4SJeCK8DJEkERj6LXMJvKqG49WWSfNDufuuFEtN8msfWDd8UR4QUCmLEwFRWXC5hxEdk1XhdRSgiwuqyiPqpSTXtqUgGf67uCzEtHtN5nQKKuRYyr6xfFfV8YXKhms5JVqhmCM9869Nr4KzmLAdSLqwG6LswnFwRWwZZfC6Jf65RKV4xV5GTDqL5Ppc2QwnGDYFEUPPgLdskLbDAgwfDgE2mZnCfovUGmCjinh8UD1tW3AKfBPjFJbdF6eST8SB7EpDt162cZu7992Gaa3jNYwYnJKGKqU1izwb2WRVC3yXSHFQxr8GkTa3uQ9WAL1hyMSSNg7GqzF5a8GXFUTCw97zXUevKjtBAKxmjLQTfsmDdzYTe1oBNXEgffhVndtxhCfViYbnHVHUqEv8NQA8xiZaEzj9eCfrYyPepiq1sRruFwgjqhqhpetrQaKcSXmFjeFzCHnDR3aAV9dXQr6SyqAf7p7ML9H4rYNhLJAc4Usbuq8rVH8ysmTZPb7erhWmKXG8yFWqc6mE6tekXUuyvPhh3uXJWZgc6Z2RDbDNRvZNkxbUMDEDfb3iLtcNd3wGGLFndzryQNft8FZS4xwaskVZFQkFga3dfCgkMv3NAXrRTPmrDYD2WgurR8PfewJAJ2nu4GpMJadgTkkkLYvgrVxC8jp3w39dXzSCKAcQ7cGWyvYW6HK1s1VcG9QiogDf6YhM5mfroCCn6HweQ7hDdYtRvSyuDBVaZAJmhxKBffsGsApKocqPeZMjo8hsRr3bWgJA2xBhzxn42HCgDf2qULBH4b9HN5N3hyR7WURyVr9Y1vXwFTakEtMsr861X88mi2yUi7aqRh3XAFoN11Do9N34UPSzreELFk3SCxJT4uAdsKQrCm5yRo1zt5Mgh4tpHfgk4SsY7",
                "assets": [
                    {
                        "tokenId": "a40b86c663fbbfefa243c9c6ebbc5690fc4e385f15b44c49ba469c91c5af0f48",
                        "index": 0,
                        "amount": 1,
                        "name": "RepoNFT",
                        "decimals": 0,
                        "type": "EIP-004"
                    },
                    {
                        "tokenId": "3c6cb596273a737c3e111c31d3ec868b84676b7bad82f9888ad574b44edef267",
                        "index": 1,
                        "amount": 99999,
                        "name": "Cardano-RWT",
                        "decimals": 0,
                        "type": "EIP-004"
                    },
                    {
                        "tokenId": "a2a6c892c38d508a659caf857dbe29da4343371e597efd42e40f9bc99099a516",
                        "index": 2,
                        "amount": 101,
                        "name": "RSN",
                        "decimals": 0,
                        "type": "EIP-004"
                    }
                ],
                "additionalRegisters": {
                    "R4": {
                        "serializedValue": "1a0203414441204911d8b1e96bccba5cbbfe2938578b3b58a795156518959fcbfc3bd7232b35a8",
                        "sigmaType": "Coll[Coll[SByte]]",
                        "renderedValue": "[414441,4911d8b1e96bccba5cbbfe2938578b3b58a795156518959fcbfc3bd7232b35a8]"
                    },
                    "R5": {
                        "serializedValue": "11020002",
                        "sigmaType": "Coll[SLong]",
                        "renderedValue": "[0,1]"
                    },
                    "R6": {
                        "serializedValue": "1104c80166009e9c01",
                        "sigmaType": "Coll[SLong]",
                        "renderedValue": "[100,51,0,9999]"
                    },
                    "R7": {
                        "serializedValue": "0400",
                        "sigmaType": "SInt",
                        "renderedValue": "0"
                    }
                },
                "spentTransactionId": null,
                "mainChain": true
            }
        ],
        "total": 1
    }
`,

    secondWatcherLastUnspentBox:
        `{
        "items": [
            {
                "boxId": "3ac7e967200368b6a95f0714d24f830161fb0d5c7c173beae316969687ba98af",
                "transactionId": "dc84702d37d98367149572e1e01361c66e1b4f531ea7e0813b510e3fec91fbeb",
                "blockId": "0918e0d916d547902cf67ddab4020d12690ca558252871dd6f5c150dcd8dad2a",
                "value": 100000,
                "index": 2,
                "globalIndex": 469394,
                "creationHeight": 214337,
                "settlementHeight": 214339,
                "ergoTree": "0008cd03c29ad59831be2e5baded45a03ce9a7d4c2e83d683e11c79790e76f640d0d3e30",
                "address": "9hwWcMhrebk4Ew5pBpXaCJ7zuH8eYkY9gRfLjNP3UeBYNDShGCT",
                "assets": [
                    {
                        "tokenId": "4911d8b1e96bccba5cbbfe2938578b3b58a795156518959fcbfc3bd7232b35a8",
                        "index": 0,
                        "amount": 1,
                        "name": null,
                        "decimals": null,
                        "type": null
                    }
                ],
                "additionalRegisters": {},
                "spentTransactionId": null,
                "mainChain": true
            }
        ],
        "total": 4
    }
`,

    secondWatcherLast10UnspentBox:
        `{
        "items": [
            {
                "boxId": "3ac7e967200368b6a95f0714d24f830161fb0d5c7c173beae316969687ba98af",
                "transactionId": "dc84702d37d98367149572e1e01361c66e1b4f531ea7e0813b510e3fec91fbeb",
                "blockId": "0918e0d916d547902cf67ddab4020d12690ca558252871dd6f5c150dcd8dad2a",
                "value": 100000,
                "index": 2,
                "globalIndex": 469394,
                "creationHeight": 214337,
                "settlementHeight": 214339,
                "ergoTree": "0008cd03c29ad59831be2e5baded45a03ce9a7d4c2e83d683e11c79790e76f640d0d3e30",
                "address": "9hwWcMhrebk4Ew5pBpXaCJ7zuH8eYkY9gRfLjNP3UeBYNDShGCT",
                "assets": [
                    {
                        "tokenId": "4911d8b1e96bccba5cbbfe2938578b3b58a795156518959fcbfc3bd7232b35a8",
                        "index": 0,
                        "amount": 1,
                        "name": null,
                        "decimals": null,
                        "type": null
                    }
                ],
                "additionalRegisters": {},
                "spentTransactionId": null,
                "mainChain": true
            },
            {
                "boxId": "762a25c986e4cc2dfbad6e092b214307ab88de9a073d01e80c17a81efab6d98b",
                "transactionId": "e841baa12e63bdf30f72c789b0ec2f6c4af382aaa47749a00d963a8a7d7bc243",
                "blockId": "7cc00b6bcf22346f376005a60120409468b104b7044c851048e29dd07452e606",
                "value": 94500000,
                "index": 1,
                "globalIndex": 464579,
                "creationHeight": 211940,
                "settlementHeight": 211942,
                "ergoTree": "0008cd03c29ad59831be2e5baded45a03ce9a7d4c2e83d683e11c79790e76f640d0d3e30",
                "address": "9hwWcMhrebk4Ew5pBpXaCJ7zuH8eYkY9gRfLjNP3UeBYNDShGCT",
                "assets": [
                    {
                        "tokenId": "a2a6c892c38d508a659caf857dbe29da4343371e597efd42e40f9bc99099a516",
                        "index": 0,
                        "amount": 100,
                        "name": "RSN",
                        "decimals": 0,
                        "type": "EIP-004"
                    },
                    {
                        "tokenId": "bc01703067be4e0effc54f742a6c62ef6edc289e49df3c2e08ada204fb1e14c3",
                        "index": 1,
                        "amount": 1,
                        "name": null,
                        "decimals": null,
                        "type": null
                    }
                ],
                "additionalRegisters": {},
                "spentTransactionId": null,
                "mainChain": true
            },
            {
                "boxId": "61b4f0080f8af2046a26fbaeca3e7404075b9b2ae4d74d07920abac09a6a766b",
                "transactionId": "1dd5df72468937e6e277bdd74d265919457c8c7b320053c7d503dcdf1bf67343",
                "blockId": "e0e906cc014e89448432b632f0c65720048c5240d5b8d0a61af050887a05885e",
                "value": 10000000,
                "index": 0,
                "globalIndex": 446913,
                "creationHeight": 203158,
                "settlementHeight": 203160,
                "ergoTree": "0008cd03c29ad59831be2e5baded45a03ce9a7d4c2e83d683e11c79790e76f640d0d3e30",
                "address": "9hwWcMhrebk4Ew5pBpXaCJ7zuH8eYkY9gRfLjNP3UeBYNDShGCT",
                "assets": [
                    {
                        "tokenId": "34a217f1d2bc0f84607dad61c886de53f1ca919c389f184136f05a0de1d196f2",
                        "index": 0,
                        "amount": 100,
                        "name": "testt",
                        "decimals": 0,
                        "type": "EIP-004"
                    }
                ],
                "additionalRegisters": {},
                "spentTransactionId": null,
                "mainChain": true
            },
            {
                "boxId": "18bb8ff0fdb2c005405ddee776e08303f6a129495e2a0e68969fe5e25844a689",
                "transactionId": "fa8be159e331ba1e94e4a7facd8b4ab84a53b3512df30b836ba5c81cb299f167",
                "blockId": "4ee00ea11d241afc4f032dddad50ee953974d67d870e314058e20e16f365e5ed",
                "value": 10000000,
                "index": 0,
                "globalIndex": 446867,
                "creationHeight": 203142,
                "settlementHeight": 203144,
                "ergoTree": "0008cd03c29ad59831be2e5baded45a03ce9a7d4c2e83d683e11c79790e76f640d0d3e30",
                "address": "9hwWcMhrebk4Ew5pBpXaCJ7zuH8eYkY9gRfLjNP3UeBYNDShGCT",
                "assets": [
                    {
                        "tokenId": "2c966d5840c8725aff53414b3e60f494d4f1b79e642c9ef806e6536ec32f77f9",
                        "index": 0,
                        "amount": 100,
                        "name": "myt",
                        "decimals": 1000,
                        "type": "EIP-004"
                    }
                ],
                "additionalRegisters": {},
                "spentTransactionId": null,
                "mainChain": true
            }
        ],
        "total": 4
    }
`,

    fraudScript:
        `{
        // ----------------- REGISTERS
        // R4: Coll[Coll[Byte]] = [WID]
        // ----------------- TOKENS
        // 0: RWT

        val repoNFT = fromBase64("pAuGxmP7v++iQ8nG67xWkPxOOF8VtExJukackcWvD0g=");
        val cleanupNFT = fromBase64("rAwWzujK79CBTFVoqdUL6lH+yI6Ku9Osg0e5TQVKG2U=");
        val outputWithToken = OUTPUTS.slice(1, OUTPUTS.size).filter { (box: Box) => box.tokens.size > 0 }
        val outputWithRWT = outputWithToken.exists { (box: Box) => box.tokens.exists { (token: (Coll[Byte], Long)) => token._1 == SELF.tokens(0)._1 } }
        // RSN Slash
        // [Repo, Fraud, Cleanup] => [Repo, Cleanup, Slashed]
        sigmaProp(
            allOf(
                Coll(
                    outputWithRWT == false,
                    INPUTS(0).tokens(0)._1 == repoNFT,
                    INPUTS(2).tokens(0)._1 == cleanupNFT,
                )
            )
        )
      }`,

    fraudP2SAddress:
        {
            "address": "LFz5FPkW7nPVq2NA5Ycb8gu5kAnbT4HuaiK2XJtJi1hZCL4ZtPaXqJZkhonpoVLW34mTrqwMCeW96tt7nyK5XTu6QmUAD9T22mLYa6opX3WdM1wpJC5ofhDUym8N4AB2Y7FnJ9ku512wGU8GJZ5xVgMQ3G5oHJJTQ1uBd72RphnWbfHUVjF49h2jgz4H9gBZQ8wFwZizTFjVh3CnMs76HP9mnnN4ngysoGzEZJqd2BREmGxPdPvBw"
        },

    eventTriggerScript:
        `{
          // ----------------- REGISTERS
          // R4: Coll[Coll[Byte]] [WID[]]
          // R5: Coll[Coll[Byte]] Event data
          // R6: Coll[Byte] Permit contract script digest
          // ----------------- TOKENS
          // 0: RWT
        
          // [TriggerEvent, CleanupToken(if fraud)] => [Fraud1, Fraud2, ...]
          val cleanupNFT = fromBase64("rAwWzujK79CBTFVoqdUL6lH+yI6Ku9Osg0e5TQVKG2U=");
          val guardNFT = fromBase64("pqw4Hm+pmSn9FHezupSZeQp3XpHUwUxaqG6aEY36yFM=");
          val cleanupConfirmation = 0;
          val FraudScriptHash = fromBase64("hLXaXSqbN0ABVW/9UlklEqCmMvLcsGyoAPX2RiwbUx0=");
          val fraudScriptCheck = if(blake2b256(OUTPUTS(0).propositionBytes) == FraudScriptHash) {
            allOf(
              Coll(
                INPUTS(1).tokens(0)._1 == cleanupNFT,
                HEIGHT - cleanupConfirmation >= SELF.creationInfo._1
              )
            )
          } else {
            allOf(
              Coll(
                INPUTS(1).tokens(0)._1 == guardNFT,
                blake2b256(OUTPUTS(0).propositionBytes) == SELF.R6[Coll[Byte]].get
              )
            )
          }
          val WIDs: Coll[Coll[Byte]] = SELF.R4[Coll[Coll[Byte]]].get
          val mergeBoxes = OUTPUTS.slice(0, WIDs.size)
          val checkAllWIDs = WIDs.zip(mergeBoxes).forall {
            (data: (Coll[Byte], Box)) => {
              Coll(data._1) == data._2.R4[Coll[Coll[Byte]]].get && data._2.propositionBytes == OUTPUTS(0).propositionBytes
            }
          }
          sigmaProp(
            allOf(
              Coll(
                WIDs.size == mergeBoxes.size,
                checkAllWIDs,
                fraudScriptCheck,
              )
            )
          )
        }`,

    eventTriggerP2SAddress: {
        "address": "LkY4RECaMvZiFwMrxpzB4uTr1ZqrKGFkZ5mUnoMPw7LEB5crVok7VueBVTS2NCMt5TYSaHRDiHnTezgGQvKcBMJUawkQEpGZWp87nLHHbaG3VaxxeQK94fxAj2zSzSU2svzA6DPrKR7JL4LZPLaW98cWBwk1YWQTqjWebTgvPkMvqYKsGgjn8Zk6uxEiXvRLzfDvGutVAmNRzcXwU9NjdBKSJrfpWFoFLMDY3chG2gcCSYiYjnqYW1sQNEcnDPJscNbcoFYEonUojtZ6m1zjwvWHXcH5UpKk9SEmxemgi7x1ezKnYJupbHsaiGEJEhtcAUWmMCSJH5iRQZQbKAud5qYDM7VX3MAqaAv9wB6uRaGKuoKShyzP"
    },

    commitmentContract:
        `{
      // ----------------- REGISTERS
      // R4: Coll[Coll[Byte]] = [WID]
      // R5: Coll[Coll[Byte]] = [Request ID (Hash(TxId))]
      // R6: Coll[Byte] = Event Data Digest
      // R7: Coll[Byte] = Permit Script Digest
      // ----------------- TOKENS
      // 0: X-RWT
      
      val eventTriggerHash = fromBase64("nM8ZiGc0B8a0SE/5BuPSV5KyAE/xuuvXnuAy3Av+J18=");
      val event = if (blake2b256(INPUTS(0).propositionBytes) == eventTriggerHash) INPUTS(0) else OUTPUTS(0)
      val myWID = SELF.R4[Coll[Coll[Byte]]].get
      val WIDs = event.R4[Coll[Coll[Byte]]].get
      val paddedData = if(event.R5[Coll[Coll[Byte]]].isDefined) {
        event.R5[Coll[Coll[Byte]]].get.fold(Coll(0.toByte), { (a: Coll[Byte], b: Coll[Byte]) => a ++ b } )
      }else{
        Coll(0.toByte)
      }
      val eventData = paddedData.slice(1, paddedData.size)
      if(blake2b256(INPUTS(0).propositionBytes) == eventTriggerHash){
        // Reward Distribution (for missed commitments)
        // [EventTrigger, Commitments[], BridgeWallet] => [WatcherPermits[], BridgeWallet]
        val permitBox = OUTPUTS.filter {(box:Box) => 
          if(box.R4[Coll[Coll[Byte]]].isDefined)
            box.R4[Coll[Coll[Byte]]].get == myWID
          else false
        }(0)
        val WIDExists =  WIDs.exists {(WID: Coll[Byte]) => myWID == Coll(WID)}
        sigmaProp(
          allOf(
            Coll(
              blake2b256(permitBox.propositionBytes) == SELF.R7[Coll[Byte]].get,
              permitBox.tokens(0)._1 == SELF.tokens(0)._1,
              // check for duplicates
              WIDExists == false,
              // validate commitment
              blake2b256(eventData ++ myWID(0)) == SELF.R6[Coll[Byte]].get
            )
          )
        )
    
      } else if (blake2b256(OUTPUTS(0).propositionBytes) == eventTriggerHash){
        // Event Trigger Creation
        // [Commitments[], WID] + [Repo(DataInput)] => [EventTrigger, WID]
        val commitmentBoxes = INPUTS.filter { (box: Box) => SELF.propositionBytes == box.propositionBytes }
        val myWIDCommitments = commitmentBoxes.filter{ (box: Box) => box.R4[Coll[Coll[Byte]]].get == myWID }
        val myWIDExists = WIDs.exists{ (WID: Coll[Byte]) => Coll(WID) == myWID }
        val repo = CONTEXT.dataInputs(0)
        val requestId = if(event.R5[Coll[Coll[Byte]]].isDefined) {
          blake2b256(event.R5[Coll[Coll[Byte]]].get(0))
        } else {
          Coll(0.toByte)
        }
        val repoR6 = repo.R6[Coll[Long]].get
        val maxCommitment = repoR6(3)
        val requiredCommitmentFromFormula: Long = repoR6(2) + repoR6(1) * (repo.R4[Coll[Coll[Byte]]].get.size - 1L) / 100L
        val requiredCommitment = if(maxCommitment < requiredCommitmentFromFormula) {
          maxCommitment
        } else {
          requiredCommitmentFromFormula
        }
        sigmaProp(
          allOf(
            Coll(
              myWIDCommitments.size == 1,
              myWIDExists,
              event.R6[Coll[Byte]].get == SELF.R7[Coll[Byte]].get,
              WIDs.size == commitmentBoxes.size,
              // TODO verify commitment to be correct
              blake2b256(eventData ++ myWID(0)) == SELF.R6[Coll[Byte]].get,
              // check event id
              SELF.R5[Coll[Coll[Byte]]].get == Coll(requestId),
              // check commitment count
              commitmentBoxes.size > requiredCommitment,
            )
          )
        )
      } else {
        // Commitment Redeem
        // [Commitment, WID] => [Permit, WID]
        sigmaProp(
          allOf(
            Coll(
              SELF.id == INPUTS(0).id,
              OUTPUTS(0).tokens(0)._1 == SELF.tokens(0)._1,
              // check WID copied
              OUTPUTS(0).R4[Coll[Coll[Byte]]].get == myWID,
              // check user WID
              INPUTS(1).tokens(0)._1 == myWID(0),
              // check permit contract address
              blake2b256(OUTPUTS(0).propositionBytes) == SELF.R7[Coll[Byte]].get
            )
          )
        )
      }
    }`,

    commitmentP2SAddress: {
        "address": "EurZwDoNU1Y6ZDtRgb2ufgAGAnJ4oNyiFvr7VyoJeKW9r1W7NbbitXDiqMNzAh8vQRATLiFRXra42mHBogMxySorHXF4hwKcPNasRPBfwcEMbRMTp8Xo1gur26V561z8wit9BE8nvRztDstzKdMkXLwjh1GGpXuFHV8GKo5Sz4d2Rb4W7QiqbFbFdRVe3TRqmv7yy2VvF9kWhRr5xTLkmxAUpEmYQwVVLmdU52XyahV7Hnw15DY3faHne4SkYtMMKSH5rvtXFUNf7UDeU8U2mjmt8oZYpprCi2ZouQNcLrDXT9i6hJ3jcmwhMfF1whQjZRNooFvcM59bmnvG3U1dJupdVpjTqXwwmGT9BkJFnX2eWjmNQ2EEfpSyUPMf5mpXBp8484u7ibjfobHpe3Jw9bHGe5nqtuLdEVKt7pe5pp5Lpv8Lqw1h8kopx9kHGKfZrVoQCsJRjHGpGZEnFgqtk4p58mLvn1y86HQwfkMBcfeRiy1qimmwbaTrn4tHbz1WJ481z8H8VxSTrrsWSpDZf4CJaRzh6mmqMTw2SxgN3vsxxAyb21yVazMryAtPAr12hjBAVf2MTuZ8QTQp68VHHZg7ePXaitbS6qkV16T9cTbkYyCWqahQbq7LLp3xMQXywZa9XpnRvFEboLtQJjNBvLtTT1UV4N2Hqw3h8qHq1DFqd4dzkj9ycaazTMiDe67mq5avy3zmgjzXUZdTxPKHkxWJCSccwnp7d2wJU3gCfF7k3Z81ui6XBMh6pzgND2U2rGzpF3aUE5LftZMhkQ5d5dg7JHnBQ62jLj2UF"
    },

    watcherPermitContract:
        `{
         // ----------------- REGISTERS
         // R4: Coll[Coll[Byte]] = [WID]
         // ----------------- TOKENS
         // 0: X-RWT
         
         val repoNFT = fromBase64("pAuGxmP7v++iQ8nG67xWkPxOOF8VtExJukackcWvD0g=");
         val commitmentScriptHash = fromBase64("hy/uApOK9sk9/0MEnsYbN551wFmwXzkwSz8c5QzzrZM=");
         val WID = SELF.R4[Coll[Coll[Byte]]].get
         val outputWithToken = OUTPUTS.slice(2, OUTPUTS.size).filter { (box: Box) => box.tokens.size > 0 }
         val outputWithRWT = outputWithToken.exists { (box: Box) => box.tokens.exists { (token: (Coll[Byte], Long)) => token._1 == SELF.tokens(0)._1 } }
         val secondBoxHasRWT = OUTPUTS(1).tokens.exists { (token: (Coll[Byte], Long)) => token._1 == SELF.tokens(0)._1 }
         if(OUTPUTS(0).tokens(0)._1 == repoNFT){
           // Updating Permit (Return or receive more tokens)
           // [Repo, Permit(SELF), WID] => [Repo, Permit(optional), WID(+userChange)]
           val outputPermitCheck = if(secondBoxHasRWT){
             allOf(
               Coll(
                 OUTPUTS(1).tokens(0)._1 == SELF.tokens(0)._1,
                 OUTPUTS(1).propositionBytes == SELF.propositionBytes,
               )
             )
           }else{
             true
           }
           sigmaProp(
             allOf(
               Coll(
                 outputWithRWT == false,
                 INPUTS(2).tokens(0)._1 == WID(0),
                 outputPermitCheck,
               )
             )
           )
         }else{
           // Event Commitment Creation
           // [Permit, WID] => [Permit(Optional), Commitment, WID]
           val outputCommitmentCheck = if(secondBoxHasRWT){
             allOf(
               Coll(
                 OUTPUTS(1).tokens(0)._1 == SELF.tokens(0)._1,
                 blake2b256(OUTPUTS(1).propositionBytes) == commitmentScriptHash,
                 OUTPUTS(1).R5[Coll[Coll[Byte]]].isDefined,
                 OUTPUTS(1).R6[Coll[Byte]].isDefined,
                 OUTPUTS(1).R7[Coll[Byte]].get == blake2b256(SELF.propositionBytes),
                 OUTPUTS(1).R4[Coll[Coll[Byte]]].get == WID,
                 OUTPUTS(1).tokens(0)._2 == 1,
               )
             )
           }else{
             true
           }
           sigmaProp(
             allOf(
               Coll(
                 outputWithRWT == false,
                 OUTPUTS(0).propositionBytes == SELF.propositionBytes,
                 OUTPUTS(0).R4[Coll[Coll[Byte]]].get == WID,
                 INPUTS(1).tokens(0)._1 == WID(0),
                 outputCommitmentCheck,
               )
             )
           )
         }
       }`,

    watcherPermitP2SA: {
        "address": "EE7687i4URb4YuSGSQXPCbAjMfN4dUt5Qx8BqKZJiZhDY8fdnSUwcAGqAsqfn1tW1byXB8nDrgkFzkAFgaaempKxfcPtE1W4ZA6mbFZohS4qMVYjUTQNhcZh3XPmgrKLCHqSJBmZTzkr3DQVzvo1YYSpfwPSHeomitjSFC4iS9N71YR6SbNXYPTFSjTPZTgxs7S2hBTrk7FsYXXe3EnVmnnEA8p1EZ5MBhLWBRgdBLGMuVUwPUeVEHszKmLHfqSkN7bnCAgrCaNbg1gZAPfmxgyLLYZJNS4NqpoYZogancR9hRk2D6FBncc81A3vNMrGWKmVFctX9cJNiFH7yvK1sdJekgVRazZnu9KRbKe61kUZToAfNAWcskHDNgex7t5k61pr2vjENf3L64o7WiaqVGaky5QmFvZuRBdw3fwx4F84zVNrpBjB7AsBnJb7ZCeFBq7rDCaBvZdnM9m2WNVkcZYEkmvgqSg1KV6DAVRWK85dkLaEgf4zyDqV9N6aG7iWExPeAMetGF6k2n89s6TZvtq99TqbW8T7tCLkn4B"
    },

    RWTRepoContract:
        `{
              // ----------------- REGISTERS
              // R4: Coll[Coll[Byte]] = [Chain id, WID_0, WID_1, ...] (Stores Chain id and related watcher ids)
              // R5: Coll[Long] = [0, X-RWT_0, X-RWT_1, ...] (The first element is zero and the rest indicates X-RWT count for watcher i)
              // R6: Coll[Long] = [RSN/X-RWT factor, Watcher quorum percentage, minimum needed approval, maximum needed approval]
              // (Minimum number of commitments needed for an event is: min(R6[3], R6[1] * (len(R4) - 1) / 100 + R6[2]) )
              // R7: Int = Watcher index (only used in returning permits phase)
              // ----------------- TOKENSe
              // 0: X-RWT Repo NFT
              // 1: X-RWT
              // 2: RSN
            
              val GuardNFT = fromBase64("pqw4Hm+pmSn9FHezupSZeQp3XpHUwUxaqG6aEY36yFM=");
              if(INPUTS(1).tokens(0)._1 == GuardNFT){
                // RWT Repo Update transaction
                sigmaProp(true)
              } else {
                val permitScriptHash = fromBase64("E/464nehlbgwSOPiaFKRGPpMGMygkx47SKj1/M7HW8k=");
                val repoOut = OUTPUTS(0)
                val repo = SELF
                val widListSize = repo.R5[Coll[Long]].get.size
                val widOutListSize = repoOut.R5[Coll[Long]].get.size
                val repoReplication = allOf(
                  Coll(
                    repoOut.propositionBytes == repo.propositionBytes,
                    repoOut.R6[Coll[Long]].get == repo.R6[Coll[Long]].get,
                    repoOut.tokens(0)._1 == repo.tokens(0)._1,
                    repoOut.tokens(1)._1 == repo.tokens(1)._1,
                    repoOut.tokens(2)._1 == repo.tokens(2)._1,
                  )
                )
                if(repo.tokens(1)._2 > repoOut.tokens(1)._2){
                  // Getting Watcher Permit
                  // [Repo, UserInputs] => [Repo, watcherPermit, WIDToken]
                  val permit = OUTPUTS(1)
                  val WID = OUTPUTS(2)
                  val RWTOut = repo.tokens(1)._2 - repoOut.tokens(1)._2
                  sigmaProp(
                    allOf(
                      Coll(
                        repoReplication,
                        repoOut.R4[Coll[Coll[Byte]]].get.size == widListSize + 1,
                        repoOut.R4[Coll[Coll[Byte]]].get.slice(0, widOutListSize - 1) == repo.R4[Coll[Coll[Byte]]].get,
                        repoOut.R4[Coll[Coll[Byte]]].get(widOutListSize - 1) == repo.id,
                        repoOut.R5[Coll[Long]].get.size == widListSize + 1,
                        repoOut.R5[Coll[Long]].get.slice(0, widOutListSize - 1) == repo.R5[Coll[Long]].get,
                        repoOut.R5[Coll[Long]].get(widOutListSize - 1) == RWTOut,
                        RWTOut * repo.R6[Coll[Long]].get(0) == repoOut.tokens(2)._2 - repo.tokens(2)._2,
                        permit.tokens(0)._2 == RWTOut,
                        blake2b256(permit.propositionBytes) == permitScriptHash,
                        permit.R4[Coll[Coll[Byte]]].get == Coll(repo.id),
                        WID.tokens(0)._1 == repo.id
                      )
                    )
                  )
                }else{
                  // Returning Watcher Permit
                  // [repo, Permit, WIDToken] => [repo, Permit(Optional), WIDToken(+userChange)]
                  val permit = INPUTS(1)
                  val RWTIn = repoOut.tokens(1)._2 - repo.tokens(1)._2
                  val WIDIndex = repoOut.R7[Int].get
                  val watcherCount = repo.R5[Coll[Long]].get.size
                  val WIDCheckInRepo = if(repo.R5[Coll[Long]].get(WIDIndex) > RWTIn) {
                    // Returning some RWTs
                    allOf(
                      Coll(
                        repo.R5[Coll[Long]].get(WIDIndex) == repoOut.R5[Coll[Long]].get(WIDIndex) + RWTIn,
                        repo.R4[Coll[Coll[Byte]]].get == repoOut.R4[Coll[Coll[Byte]]].get
                      )
                    )
                  }else{
                    // Returning the permit
                    allOf(
                      Coll(
                        repo.R5[Coll[Long]].get(WIDIndex) == RWTIn,
                        repo.R4[Coll[Coll[Byte]]].get.slice(0, WIDIndex) == repoOut.R4[Coll[Coll[Byte]]].get.slice(0, WIDIndex),
                        repo.R4[Coll[Coll[Byte]]].get.slice(WIDIndex + 1, watcherCount) == repoOut.R4[Coll[Coll[Byte]]].get.slice(WIDIndex, watcherCount - 1),
                        repo.R5[Coll[Long]].get.slice(0, WIDIndex) == repoOut.R5[Coll[Long]].get.slice(0, WIDIndex),
                        repo.R5[Coll[Long]].get.slice(WIDIndex + 1, watcherCount) == repoOut.R5[Coll[Long]].get.slice(WIDIndex, watcherCount - 1)
                      )
                    )
                  }
                  val WID = repo.R4[Coll[Coll[Byte]]].get(WIDIndex)
                  sigmaProp(
                    allOf(
                      Coll(
                        repoReplication,
                        Coll(WID) == permit.R4[Coll[Coll[Byte]]].get,
                        RWTIn * repo.R6[Coll[Long]].get(0) == repo.tokens(2)._2 - repoOut.tokens(2)._2,
                        WIDCheckInRepo
                      )
                    )
                  )
                }
              }
            }`,

    RWTRepoP2SAddress: {
        "address": "N9nHZxAm7Z476Nbw6yF2X6BQEct7nNCm4SJeCK8DJEkERj6LXMJvKqG49WWSfNDufuuFEtN8msfWDd8UR4QUCmLEwFRWXC5hxEdk1XhdRSgiwuqyiPqpSTXtqUgGf67uCzEtHtN5nQKKuRYyr6xfFfV8YXKhms5JVqhmCM9869Nr4KzmLAdSLqwG6LswnFwRWwZZfC6Jf65RKV4xV5GTDqL5Ppc2QwnGDYFEUPPgLdskLbDAgwfDgE2mZnCfovUGmCjinh8UD1tW3AKfBPjFJbdF6eST8SB7EpDt162cZu7992Gaa3jNYwYnJKGKqU1izwb2WRVC3yXSHFQxr8GkTa3uQ9WAL1hyMSSNg7GqzF5a8GXFUTCw97zXUevKjtBAKxmjLQTfsmDdzYTe1oBNXEgffhVndtxhCfViYbnHVHUqEv8NQA8xiZaEzj9eCfrYyPepiq1sRruFwgjqhqhpetrQaKcSXmFjeFzCHnDR3aAV9dXQr6SyqAf7p7ML9H4rYNhLJAc4Usbuq8rVH8ysmTZPb7erhWmKXG8yFWqc6mE6tekXUuyvPhh3uXJWZgc6Z2RDbDNRvZNkxbUMDEDfb3iLtcNd3wGGLFndzryQNft8FZS4xwaskVZFQkFga3dfCgkMv3NAXrRTPmrDYD2WgurR8PfewJAJ2nu4GpMJadgTkkkLYvgrVxC8jp3w39dXzSCKAcQ7cGWyvYW6HK1s1VcG9QiogDf6YhM5mfroCCn6HweQ7hDdYtRvSyuDBVaZAJmhxKBffsGsApKocqPeZMjo8hsRr3bWgJA2xBhzxn42HCgDf2qULBH4b9HN5N3hyR7WURyVr9Y1vXwFTakEtMsr861X88mi2yUi7aqRh3XAFoN11Do9N34UPSzreELFk3SCxJT4uAdsKQrCm5yRo1zt5Mgh4tpHfgk4SsY7"
    },

    emptyAddressBox: `{"items": [],"total": 1}`,

    sampleTxJson:
        `{
            "id": "2ab9da11fc216660e974842cc3b7705e62ebb9e0bf5ff78e53f9cd40abadd117",
            "inputs": [
                {
                    "boxId": "1ab9da11fc216660e974842cc3b7705e62ebb9e0bf5ff78e53f9cd40abadd117",
                    "spendingProof": {
                        "proofBytes": "4ab9da11fc216660e974842cc3b7705e62ebb9e0bf5ff78e53f9cd40abadd1173ab9da11fc216660e974842cc3b7705e62ebb9e0bf5ff78e53f9cd40abadd1173ab9da11fc216660e974842cc3b7705e62ebb9e0bf5ff78e53f9cd40abadd117",
                        "extension": {
                            "1": "a2aed72ff1b139f35d1ad2938cb44c9848a34d4dcfd6d8ab717ebde40a7304f2541cf628ffc8b5c496e6161eba3f169c6dd440704b1719e0"
                        }
                    }
                }
            ],
            "dataInputs": [
                {
                    "boxId": "1ab9da11fc216660e974842cc3b7705e62ebb9e0bf5ff78e53f9cd40abadd117"
                }
            ],
            "outputs": [
                {
                    "boxId": "1ab9da11fc216660e974842cc3b7705e62ebb9e0bf5ff78e53f9cd40abadd117",
                    "value": 147,
                    "ergoTree": "0008cd0336100ef59ced80ba5f89c4178ebd57b6c1dd0f3d135ee1db9f62fc634d637041",
                    "creationHeight": 9149,
                    "assets": [
                        {
                            "tokenId": "4ab9da11fc216660e974842cc3b7705e62ebb9e0bf5ff78e53f9cd40abadd117",
                            "amount": 1000
                        }
                    ],
                    "additionalRegisters": {
                        "R4": "100204a00b08cd0336100ef59ced80ba5f89c4178ebd57b6c1dd0f3d135ee1db9f62fc634d637041ea02d192a39a8cc7a70173007301"
                    },
                    "transactionId": "2ab9da11fc216660e974842cc3b7705e62ebb9e0bf5ff78e53f9cd40abadd117",
                    "index": 0
                }
            ],
            "size": 0
        }`,

    sampleTxId: "2ab9da11fc216660e974842cc3b7705e62ebb9e0bf5ff78e53f9cd40abadd117",

    unspentBox:
        `{
            "boxId": "ec0dcb8cfd0a8460068830210d723e4d0ec14b2adeaf7076ad64b606aef7a881",
            "transactionId": "0359045585957c6cba13cb873171b41da5f2bde97aee840719a40c51ec2f210b",
            "blockId": "024c093294376f40bc524ced694bb38020f242c3bafc4c0e789dcc74baf909a5",
            "value": 1000000000,
            "index": 0,
            "globalIndex": 483293,
            "creationHeight": 221243,
            "settlementHeight": 221245,
            "ergoTree": "0008cd03df7b309dc5db4506dd1f400eff35931cf889338d29aacefba8491633333d6b3c",
            "address": "9iAEDf2b4J5T1QSAPStkSbSzNUUW38cy8EMJkKC3cxHCBoaQYfY",
            "assets": [],
            "additionalRegisters": {},
            "spentTransactionId": null,
            "mainChain": true
        }`,

    mempoolTxs:
        `{
            "items": [
                {
                    "id": "66bc08610b836e810620236eb727b7a7264d5b6e6428eb94a6aed84895f61b15",
                    "creationTimestamp": 1654588295781,
                    "inputs": [
                        {
                            "boxId": "ec0dcb8cfd0a8460068830210d723e4d0ec14b2adeaf7076ad64b606aef7a881",
                            "value": 1000000000,
                            "index": 0,
                            "spendingProof": "15311039251ca496b21eaf89794ec14db748fe3974060d74b6e8dbcce40aa87bacc6eec9cd59e2de987f59f543c9fff704859a71064aafc2",
                            "outputBlockId": "024c093294376f40bc524ced694bb38020f242c3bafc4c0e789dcc74baf909a5",
                            "outputTransactionId": "0359045585957c6cba13cb873171b41da5f2bde97aee840719a40c51ec2f210b",
                            "outputIndex": 0,
                            "ergoTree": "0008cd03df7b309dc5db4506dd1f400eff35931cf889338d29aacefba8491633333d6b3c",
                            "address": "9iAEDf2b4J5T1QSAPStkSbSzNUUW38cy8EMJkKC3cxHCBoaQYfY",
                            "assets": [],
                            "additionalRegisters": {}
                        }
                    ],
                    "dataInputs": [],
                    "outputs": [
                        {
                            "boxId": "2afbd9393fb1ddb982e9d82a269e27b1b97184c1bc45451d5c63dae28d25d708",
                            "transactionId": "66bc08610b836e810620236eb727b7a7264d5b6e6428eb94a6aed84895f61b15",
                            "value": 1000000,
                            "index": 0,
                            "creationHeight": 0,
                            "ergoTree": "0008cd03df7b309dc5db4506dd1f400eff35931cf889338d29aacefba8491633333d6b3c",
                            "address": "9iAEDf2b4J5T1QSAPStkSbSzNUUW38cy8EMJkKC3cxHCBoaQYfY",
                            "assets": [],
                            "additionalRegisters": {},
                            "spentTransactionId": null
                        },
                        {
                            "boxId": "00499ad9b345018ee3ec3a661adaed59736ec8cbccd2ffd79d03805563eb2a48",
                            "transactionId": "66bc08610b836e810620236eb727b7a7264d5b6e6428eb94a6aed84895f61b15",
                            "value": 998000000,
                            "index": 1,
                            "creationHeight": 0,
                            "ergoTree": "0008cd03df7b309dc5db4506dd1f400eff35931cf889338d29aacefba8491633333d6b3c",
                            "address": "9iAEDf2b4J5T1QSAPStkSbSzNUUW38cy8EMJkKC3cxHCBoaQYfY",
                            "assets": [],
                            "additionalRegisters": {},
                            "spentTransactionId": null
                        },
                        {
                            "boxId": "467fc622b55a8e0540c1b42b9ed221c558e77dfd5f71d93b484700206d813bbe",
                            "transactionId": "66bc08610b836e810620236eb727b7a7264d5b6e6428eb94a6aed84895f61b15",
                            "value": 1000000,
                            "index": 2,
                            "creationHeight": 0,
                            "ergoTree": "1005040004000e36100204a00b08cd0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798ea02d192a39a8cc7a701730073011001020402d19683030193a38cc7b2a57300000193c2b2a57301007473027303830108cdeeac93b1a57304",
                            "address": "2iHkR7CWvD1R4j1yZg5bkeDRQavjAaVPeTDFGGLZduHyfWMuYpmhHocX8GJoaieTx78FntzJbCBVL6rf96ocJoZdmWBL2fci7NqWgAirppPQmZ7fN9V6z13Ay6brPriBKYqLp1bT2Fk4FkFLCfdPpe",
                            "assets": [],
                            "additionalRegisters": {},
                            "spentTransactionId": null
                        }
                    ],
                    "size": 291
                }
            ],
            "total": 1
        }`,

}


