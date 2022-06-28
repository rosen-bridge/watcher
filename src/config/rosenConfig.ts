export type rosenConfig = {
    RSN: string;
    minBoxValue: string;
    fee: string;
    guardNFT: string;
    cleanupNFT: string;
    cleanupConfirm: number;
    watcherPermitAddress: string;
    RWTRepoAddress: string;
    fraudAddress: string;
    eventTriggerAddress: string;
    commitmentAddress: string;
    lockAddress: string
}

export const rosenConfig: rosenConfig = {
    RSN: "a2a6c892c38d508a659caf857dbe29da4343371e597efd42e40f9bc99099a516",
    minBoxValue: "1100000",
    fee: "1100000",
    guardNFT: "a6ac381e6fa99929fd1477b3ba9499790a775e91d4c14c5aa86e9a118dfac853",
    cleanupNFT: "ac0c16cee8caefd0814c5568a9d50bea51fec88e8abbd3ac8347b94d054a1b65",
    cleanupConfirm: 0,
    watcherPermitAddress: "EE7687i4URb4YuSGSQXPCbAjMfN4dUt5Qx8BqKZJiZhDY8fdnSUwcAGqAsqfn1tW1byXB8nDrgkFzkAFgaaempKxfcPtE1W4ZA6mbFZohS4qMVYjUTQNhcZh3XPmgrKLCHqSJBmZTzkr3DQVzvo1YYSpfwPSHeomitjSFC4iS9N71YR6SbNXYPTFSjTPZTgxs7S2hBTrk7FsYXXe3EnVmnnEA8p1EZ5MBhLWBRgdBLGMuVUwPUeVEHszKmLHfqSkN7bnCAgrCaNbg1gZAPfmxgyLLYZJNS4NqpoYZogancR9hRk2D6FBncc81A3vNMrGWKmVFctX9cJNiFH7yvK1sdJekgVRazZnu9KRbKe61kUZToAfNAWcskHDNgex7t5k61pr2vjENf3L64o7WiaqVGaky5QmFvZuRBdw3fwx4F84zVNrpBjB7AsBnJb7ZCeFBq7rDCaBvZdnM9m2WNVkcZYEkmvgqSg1KV6DAVRWK85dkLaEgf4zyDqV9N6aG7iWExPeAMetGF6k2n89s6TZvtq99TqbW8T7tCLkn4B",
    RWTRepoAddress: "N9nHZxAm7Z476Nbw6yF2X6BQEct7nNCm4SJeCK8DJEkERj6LXMJvKqG49WWSfNDufuuFEtN8msfWDd8UR4QUCmLEwFRWXC5hxEdk1XhdRSgiwuqyiPqpSTXtqUgGf67uCzEtHtN5nQKKuRYyr6xfFfV8YXKhms5JVqhmCM9869Nr4KzmLAdSLqwG6LswnFwRWwZZfC6Jf65RKV4xV5GTDqL5Ppc2QwnGDYFEUPPgLdskLbDAgwfDgE2mZnCfovUGmCjinh8UD1tW3AKfBPjFJbdF6eST8SB7EpDt162cZu7992Gaa3jNYwYnJKGKqU1izwb2WRVC3yXSHFQxr8GkTa3uQ9WAL1hyMSSNg7GqzF5a8GXFUTCw97zXUevKjtBAKxmjLQTfsmDdzYTe1oBNXEgffhVndtxhCfViYbnHVHUqEv8NQA8xiZaEzj9eCfrYyPepiq1sRruFwgjqhqhpetrQaKcSXmFjeFzCHnDR3aAV9dXQr6SyqAf7p7ML9H4rYNhLJAc4Usbuq8rVH8ysmTZPb7erhWmKXG8yFWqc6mE6tekXUuyvPhh3uXJWZgc6Z2RDbDNRvZNkxbUMDEDfb3iLtcNd3wGGLFndzryQNft8FZS4xwaskVZFQkFga3dfCgkMv3NAXrRTPmrDYD2WgurR8PfewJAJ2nu4GpMJadgTkkkLYvgrVxC8jp3w39dXzSCKAcQ7cGWyvYW6HK1s1VcG9QiogDf6YhM5mfroCCn6HweQ7hDdYtRvSyuDBVaZAJmhxKBffsGsApKocqPeZMjo8hsRr3bWgJA2xBhzxn42HCgDf2qULBH4b9HN5N3hyR7WURyVr9Y1vXwFTakEtMsr861X88mi2yUi7aqRh3XAFoN11Do9N34UPSzreELFk3SCxJT4uAdsKQrCm5yRo1zt5Mgh4tpHfgk4SsY7",
    fraudAddress: "LFz5FPkW7nPVq2NA5Ycb8gu5kAnbT4HuaiK2XJtJi1hZCL4ZtPaXqJZkhonpoVLW34mTrqwMCeW96tt7nyK5XTu6QmUAD9T22mLYa6opX3WdM1wpJC5ofhDUym8N4AB2Y7FnJ9ku512wGU8GJZ5xVgMQ3G5oHJJTQ1uBd72RphnWbfHUVjF49h2jgz4H9gBZQ8wFwZizTFjVh3CnMs76HP9mnnN4ngysoGzEZJqd2BREmGxPdPvBw",
    eventTriggerAddress: "LkY4RECaMvZiFwMrxpzB4uTr1ZqrKGFkZ5mUnoMPw7LEB5crVok7VueBVTS2NCMt5TYSaHRDiHnTezgGQvKcBMJUawkQEpGZWp87nLHHbaG3VaxxeQK94fxAj2zSzSU2svzA6DPrKR7JL4LZPLaW98cWBwk1YWQTqjWebTgvPkMvqYKsGgjn8Zk6uxEiXvRLzfDvGutVAmNRzcXwU9NjdBKSJrfpWFoFLMDY3chG2gcCSYiYjnqYW1sQNEcnDPJscNbcoFYEonUojtZ6m1zjwvWHXcH5UpKk9SEmxemgi7x1ezKnYJupbHsaiGEJEhtcAUWmMCSJH5iRQZQbKAud5qYDM7VX3MAqaAv9wB6uRaGKuoKShyzP",
    commitmentAddress: "EurZwDoNU1Y6ZDtRgb2ufgAGAnJ4oNyiFvr7VyoJeKW9r1W7NbbitXDiqMNzAh8vQRATLiFRXra42mHBogMxySorHXF4hwKcPNasRPBfwcEMbRMTp8Xo1gur26V561z8wit9BE8nvRztDstzKdMkXLwjh1GGpXuFHV8GKo5Sz4d2Rb4W7QiqbFbFdRVe3TRqmv7yy2VvF9kWhRr5xTLkmxAUpEmYQwVVLmdU52XyahV7Hnw15DY3faHne4SkYtMMKSH5rvtXFUNf7UDeU8U2mjmt8oZYpprCi2ZouQNcLrDXT9i6hJ3jcmwhMfF1whQjZRNooFvcM59bmnvG3U1dJupdVpjTqXwwmGT9BkJFnX2eWjmNQ2EEfpSyUPMf5mpXBp8484u7ibjfobHpe3Jw9bHGe5nqtuLdEVKt7pe5pp5Lpv8Lqw1h8kopx9kHGKfZrVoQCsJRjHGpGZEnFgqtk4p58mLvn1y86HQwfkMBcfeRiy1qimmwbaTrn4tHbz1WJ481z8H8VxSTrrsWSpDZf4CJaRzh6mmqMTw2SxgN3vsxxAyb21yVazMryAtPAr12hjBAVf2MTuZ8QTQp68VHHZg7ePXaitbS6qkV16T9cTbkYyCWqahQbq7LLp3xMQXywZa9XpnRvFEboLtQJjNBvLtTT1UV4N2Hqw3h8qHq1DFqd4dzkj9ycaazTMiDe67mq5avy3zmgjzXUZdTxPKHkxWJCSccwnp7d2wJU3gCfF7k3Z81ui6XBMh6pzgND2U2rGzpF3aUE5LftZMhkQ5d5dg7JHnBQ62jLj2UF",
    lockAddress: "replace",
};

