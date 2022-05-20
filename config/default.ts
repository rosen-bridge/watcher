import * as wasm from "ergo-lib-wasm-nodejs";

export default {
    node: {
        URL: "https://testnet.koios.rest/api/v0",
    },
    scanner: {
        interval: 10,
        initialBlockHeight: 3471392,
    },
    ergo: {
        explorerUrl: "https://api.ergoplatform.com/",
        nodeUrl: "http://10.10.9.3:9064",
        networkType: wasm.NetworkPrefix.Mainnet
    },
    commitmentScanner: {
        interval: 10,
        initialBlockHeight: 208640,
        heightLimit: 100,
    },
};

export const commitmentAddress = "EurZwDoNTXuraUu37sjKwpEPkoumCwXHrwk8jUZzRCVyrrDywfQsbXSfh4sD9KYuNw3sqJDyKqh9URkzGTKzpFU28hWx2uUJJVhJ6LigNANqfVVjEFf4g5kkwTqLES4CpAyNLv3v8tBgtB2kGzjMZpU3qbwpZ8eh4JQQUw5cztzXc715H61hqPTH13i1qfGdph8GLV8DkczLHGektosSWXNQRXJBRvH6DVuyPRYsEeyjYr4agBxyEZ5PTx7KgYwKGFWhKbgkdaLzySZjFV7bSZXArLGpykP1UgS62o6aBydg1oPM3PTFugHQJbtusQShDNGCu5V7XXfePtJ2ybhS32NT3vP15Lzf1sXwXerGbMWLiznyLc4op1TJd5LyWrCYtznhwmjEZ7iKBxNT49BuL5QBQ3RiFFmazkhXrLLQnnqmhBfH8s8yA6rQD8hmyFm5YCaTfBPTG1LznGWtw6G9h5pZnAMuqHBBsEnKjRArTTR7uabKTCBK11oaVo8bqh3JPpHumLv7YAiC1GDHYst7KoVct9vwF5kByEag6turXiWA1JH4KNayh4VVwz8PLcGx5eyThMLkNw6t1VApcgM6DehcMhCc5D5jW4MicKrvwwYTEU4qwfHjMQ1ftanb7pRZkDZPuL9qppvQZhDdM8DzgXdMGnJK44aXujkuWZFvzKVzpPVyswgqnaLyznPEQ9xt5PVQmGrVXe44TPw9UDdeeW9wEzyVx4BHkC36LgHkbhWM36mAAfSDvFAxrDaBEBGEPt3wrJct8A6C4osCpcvUDRqKCPg2PkgrcYuem"
export const tokens ={
    RWT: "469255244f7b12ea7d375ec94ec8d2838a98be0779c8231ece3529ae69c421db",
}
