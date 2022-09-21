export const boxesSample = {
  firstRepoBox: `{
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
        }`,

  secondRepoBox: `
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
    }`,

  thirdRepoBox: `{
            "boxId": "636c5fe2c9a58041699373b21edae447574d6590782ee653638b9d3f66295728",
            "transactionId": "834703d2f92d8deea32dd977c5c2875800aabf41963d533fd64f5b5ec7dc1c80",
            "blockId": "ea948b613a3979ed9f594d2a775095755c938a61aa763388519c5ad7b6283a0b",
            "value": 1100000,
            "index": 0,
            "globalIndex": 487730,
            "creationHeight": 223456,
            "settlementHeight": 223458,
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
                    "amount": 99991,
                    "name": "Cardano-RWT",
                    "decimals": 0,
                    "type": "EIP-004"
                },
                {
                    "tokenId": "a2a6c892c38d508a659caf857dbe29da4343371e597efd42e40f9bc99099a516",
                    "index": 2,
                    "amount": 901,
                    "name": "RSN",
                    "decimals": 0,
                    "type": "EIP-004"
                }
            ],
            "additionalRegisters": {
                "R4": {
                    "serializedValue": "1a060341444120e7e510a1efceaba04926a23135caec8d28d8f5564c9f6a1e162a5415bf344b4020f8685c0397fbe7a7684324d678930830924d1d0954e433ae06fa988d998ab7e720d1907f8d9b649ab27eaba1f5788ff22a0ab5e5ae37187bc8c0ee32dccfc74c6d20906d389a39c914a393cb06c0ab7557d04b58f7e9e73284aac520d08e7dd46a8220e8aeca43ed5a9a8b5c7fea6890e3a159c591c685c0e0dfe06c8efa7b92711379",
                    "sigmaType": "Coll[Coll[SByte]]",
                    "renderedValue": "[414441,e7e510a1efceaba04926a23135caec8d28d8f5564c9f6a1e162a5415bf344b40,f8685c0397fbe7a7684324d678930830924d1d0954e433ae06fa988d998ab7e7,d1907f8d9b649ab27eaba1f5788ff22a0ab5e5ae37187bc8c0ee32dccfc74c6d,906d389a39c914a393cb06c0ab7557d04b58f7e9e73284aac520d08e7dd46a82,e8aeca43ed5a9a8b5c7fea6890e3a159c591c685c0e0dfe06c8efa7b92711379]"
                },
                "R5": {
                    "serializedValue": "1106000202020606",
                    "sigmaType": "Coll[SLong]",
                    "renderedValue": "[0,1,1,1,3,3]"
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
        }`,

  repoLastBox: `{
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
        }`,

  firstWatcherPermitBox: `{
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
            }`,

  firstPermitBox: `
        {
            "boxId": "6056eeef3715c6153c9123f22060cd684aaa3d6f6e3eb008c04f57292126c917",
            "transactionId": "834703d2f92d8deea32dd977c5c2875800aabf41963d533fd64f5b5ec7dc1c80",
            "blockId": "ea948b613a3979ed9f594d2a775095755c938a61aa763388519c5ad7b6283a0b",
            "value": 1100000,
            "index": 1,
            "globalIndex": 487731,
            "creationHeight": 223456,
            "settlementHeight": 223458,
            "ergoTree": "10130400040004040400040204000e20a40b86c663fbbfefa243c9c6ebbc5690fc4e385f15b44c49ba469c91c5af0f480404040004000400010104020400040004000e20872fee02938af6c93dff43049ec61b379e75c059b05f39304b3f1ce50cf3ad9305020101d807d601b2a5730000d6028cb2db6308a773010001d603aeb5b4a57302b1a5d901036391b1db630872037303d9010363aedb63087203d901054d0e938c7205017202d604e4c6a7041ad605b2a5730400d606db63087205d607ae7206d901074d0e938c720701720295938cb2db63087201730500017306d196830301ef7203938cb2db6308b2a473070073080001b2720473090095720796830201938cb27206730a0001720293c27205c2a7730bd801d608c2a7d196830501ef720393c27201720893e4c67201041a7204938cb2db6308b2a4730c00730d0001b27204730e00957207d801d609b27206730f0096830701938c720901720293cbc272057310e6c67205051ae6c67205060e93e4c67205070ecb720893e4c67205041a7204938c72090273117312",
            "address": "EE7687i4URb4YuSGSQXPCbAjMfN4dUt5Qx8BqKZJiZhDY8fdnSUwcAGqAsqfn1tW1byXB8nDrgkFzkAFgaaempKxfcPtE1W4ZA6mbFZohS4qMVYjUTQNhcZh3XPmgrKLCHqSJBmZTzkr3DQVzvo1YYSpfwPSHeomitjSFC4iS9N71YR6SbNXYPTFSjTPZTgxs7S2hBTrk7FsYXXe3EnVmnnEA8p1EZ5MBhLWBRgdBLGMuVUwPUeVEHszKmLHfqSkN7bnCAgrCaNbg1gZAPfmxgyLLYZJNS4NqpoYZogancR9hRk2D6FBncc81A3vNMrGWKmVFctX9cJNiFH7yvK1sdJekgVRazZnu9KRbKe61kUZToAfNAWcskHDNgex7t5k61pr2vjENf3L64o7WiaqVGaky5QmFvZuRBdw3fwx4F84zVNrpBjB7AsBnJb7ZCeFBq7rDCaBvZdnM9m2WNVkcZYEkmvgqSg1KV6DAVRWK85dkLaEgf4zyDqV9N6aG7iWExPeAMetGF6k2n89s6TZvtq99TqbW8T7tCLkn4B",
            "assets": [
                {
                    "tokenId": "3c6cb596273a737c3e111c31d3ec868b84676b7bad82f9888ad574b44edef267",
                    "index": 0,
                    "amount": 3,
                    "name": "Cardano-RWT",
                    "decimals": 0,
                    "type": "EIP-004"
                }
            ],
            "additionalRegisters": {
                "R4": {
                    "serializedValue": "1a0120e8aeca43ed5a9a8b5c7fea6890e3a159c591c685c0e0dfe06c8efa7b92711379",
                    "sigmaType": "Coll[Coll[SByte]]",
                    "renderedValue": "[e8aeca43ed5a9a8b5c7fea6890e3a159c591c685c0e0dfe06c8efa7b92711379]"
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
    `,
  secondPermitBox: `
    {
        "boxId": "fe92da4e3f2d377dba4b653caf1f13211fada224a41b59872971b8defe89aafb",
        "transactionId": "aa553fd62c0806028db7b1722bb1fc3c6d6296bf816728cab6e6bf0c36c1f71f",
        "blockId": "f633423d0092c1058dbcbf51eb99824f08429d2d539c65b41082156e4322ba72",
        "value": 1000000,
        "index": 0,
        "globalIndex": 479156,
        "creationHeight": 219182,
        "settlementHeight": 219184,
        "ergoTree": "10130400040004040400040204000e20a40b86c663fbbfefa243c9c6ebbc5690fc4e385f15b44c49ba469c91c5af0f480404040004000400010104020400040004000e20872fee02938af6c93dff43049ec61b379e75c059b05f39304b3f1ce50cf3ad9305020101d807d601b2a5730000d6028cb2db6308a773010001d603aeb5b4a57302b1a5d901036391b1db630872037303d9010363aedb63087203d901054d0e938c7205017202d604e4c6a7041ad605b2a5730400d606db63087205d607ae7206d901074d0e938c720701720295938cb2db63087201730500017306d196830301ef7203938cb2db6308b2a473070073080001b2720473090095720796830201938cb27206730a0001720293c27205c2a7730bd801d608c2a7d196830501ef720393c27201720893e4c67201041a7204938cb2db6308b2a4730c00730d0001b27204730e00957207d801d609b27206730f0096830701938c720901720293cbc272057310e6c67205051ae6c67205060e93e4c67205070ecb720893e4c67205041a7204938c72090273117312",
        "address": "EE7687i4URb4YuSGSQXPCbAjMfN4dUt5Qx8BqKZJiZhDY8fdnSUwcAGqAsqfn1tW1byXB8nDrgkFzkAFgaaempKxfcPtE1W4ZA6mbFZohS4qMVYjUTQNhcZh3XPmgrKLCHqSJBmZTzkr3DQVzvo1YYSpfwPSHeomitjSFC4iS9N71YR6SbNXYPTFSjTPZTgxs7S2hBTrk7FsYXXe3EnVmnnEA8p1EZ5MBhLWBRgdBLGMuVUwPUeVEHszKmLHfqSkN7bnCAgrCaNbg1gZAPfmxgyLLYZJNS4NqpoYZogancR9hRk2D6FBncc81A3vNMrGWKmVFctX9cJNiFH7yvK1sdJekgVRazZnu9KRbKe61kUZToAfNAWcskHDNgex7t5k61pr2vjENf3L64o7WiaqVGaky5QmFvZuRBdw3fwx4F84zVNrpBjB7AsBnJb7ZCeFBq7rDCaBvZdnM9m2WNVkcZYEkmvgqSg1KV6DAVRWK85dkLaEgf4zyDqV9N6aG7iWExPeAMetGF6k2n89s6TZvtq99TqbW8T7tCLkn4B",
        "assets": [
            {
                "tokenId": "3c6cb596273a737c3e111c31d3ec868b84676b7bad82f9888ad574b44edef267",
                "index": 0,
                "amount": 2,
                "name": "Cardano-RWT",
                "decimals": 0,
                "type": "EIP-004"
            }
        ],
        "additionalRegisters": {
            "R4": {
                "serializedValue": "1a0120906d389a39c914a393cb06c0ab7557d04b58f7e9e73284aac520d08e7dd46a82",
                "sigmaType": "Coll[Coll[SByte]]",
                "renderedValue": "[906d389a39c914a393cb06c0ab7557d04b58f7e9e73284aac520d08e7dd46a82]"
            }
        },
        "spentTransactionId": null,
        "mainChain": true
    }`,
  thirdPermitBox: `
    {
        "boxId": "fe27e70a073921f0a154ea96d623fe1414188ccf7acacb5210c037f63751807d",
        "transactionId": "a52262ecb452c8a0919b4e571fab2abfa69787bae07a9a9d081821740d4ee7cf",
        "blockId": "ea7e8e65ad851fb1ac14df5103261e56f25ebae0929830c6474a3a0149890198",
        "value": 1100000,
        "index": 1,
        "globalIndex": 476089,
        "creationHeight": 217656,
        "settlementHeight": 217658,
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
        "spentTransactionId": null,
        "mainChain": true
    }
    `,
  forthPermitBox: `
    {
        "boxId": "e1cc015338053ecd9cdaf67c89a816880626141f2d8b15a075a3739e910e4d57",
        "transactionId": "3a714c9d495f223c7e5d254b051cd016287dd051e43f60c3e6e84e26a096631a",
        "blockId": "d6a0dd196ee4561a9e7af19c6f3f165dbd26214ae55c40869ad0395b5e3a049d",
        "value": 1100000,
        "index": 1,
        "globalIndex": 474640,
        "creationHeight": 216953,
        "settlementHeight": 216955,
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
                "serializedValue": "1a0120f8685c0397fbe7a7684324d678930830924d1d0954e433ae06fa988d998ab7e7",
                "sigmaType": "Coll[Coll[SByte]]",
                "renderedValue": "[f8685c0397fbe7a7684324d678930830924d1d0954e433ae06fa988d998ab7e7]"
            },
            "R5": {
                "serializedValue": "0e0100",
                "sigmaType": "Coll[SByte]",
                "renderedValue": "00"
            }
        },
        "spentTransactionId": null,
        "mainChain": true
    }`,
  fifthPermitBox: `
    {
        "boxId": "4d3296450e5b75419aaae1d81195433e99e5a486418dcad572810fca53ad0c1b",
        "transactionId": "e51485aa3b02f3f40d94e24081f393a46beca8d8c9b567c90f7fe03a16573309",
        "blockId": "933ad5aa59760ccbc159b669c6de49b92a73cbf1ddb20f8107dbc0ca55e159d6",
        "value": 1100000,
        "index": 1,
        "globalIndex": 474528,
        "creationHeight": 216899,
        "settlementHeight": 216901,
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
                "serializedValue": "1a0120e7e510a1efceaba04926a23135caec8d28d8f5564c9f6a1e162a5415bf344b40",
                "sigmaType": "Coll[Coll[SByte]]",
                "renderedValue": "[e7e510a1efceaba04926a23135caec8d28d8f5564c9f6a1e162a5415bf344b40]"
            },
            "R5": {
                "serializedValue": "0e0100",
                "sigmaType": "Coll[SByte]",
                "renderedValue": "00"
            }
        },
        "spentTransactionId": null,
        "mainChain": true
        }`,
};
