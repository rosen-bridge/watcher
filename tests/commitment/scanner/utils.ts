import {ErgoNetworkApi} from "../../../src/commitments/network/networkApi";
import {CommitmentUtils} from "../../../src/commitments/scanner/utils";
import {expect} from "chai";

const chai = require("chai")
const spies = require("chai-spies")
chai.use(spies);

const ergoNetwork = new ErgoNetworkApi();
const tx1 = require('../dataset/transaction1.json');
const tx2 = require('../dataset/commitmentTransaction.json');
const txId1 = "7aa6b32b1eb5401039340ed3cace93d004aa513f33053c0bd7162beb4695ecf6"
const commitmentAddress = "EurZwDoNTXuraUu37sjKwpEPkoumCwXHrwk8jUZzRCVyrrDywfQsbXSfh4sD9KYuNw3sqJDyKqh9URkzGTKzpFU28hWx2uUJJVhJ6LigNANqfVVjEFf4g5kkwTqLES4CpAyNLv3v8tBgtB2kGzjMZpU3qbwpZ8eh4JQQUw5cztzXc715H61hqPTH13i1qfGdph8GLV8DkczLHGektosSWXNQRXJBRvH6DVuyPRYsEeyjYr4agBxyEZ5PTx7KgYwKGFWhKbgkdaLzySZjFV7bSZXArLGpykP1UgS62o6aBydg1oPM3PTFugHQJbtusQShDNGCu5V7XXfePtJ2ybhS32NT3vP15Lzf1sXwXerGbMWLiznyLc4op1TJd5LyWrCYtznhwmjEZ7iKBxNT49BuL5QBQ3RiFFmazkhXrLLQnnqmhBfH8s8yA6rQD8hmyFm5YCaTfBPTG1LznGWtw6G9h5pZnAMuqHBBsEnKjRArTTR7uabKTCBK11oaVo8bqh3JPpHumLv7YAiC1GDHYst7KoVct9vwF5kByEag6turXiWA1JH4KNayh4VVwz8PLcGx5eyThMLkNw6t1VApcgM6DehcMhCc5D5jW4MicKrvwwYTEU4qwfHjMQ1ftanb7pRZkDZPuL9qppvQZhDdM8DzgXdMGnJK44aXujkuWZFvzKVzpPVyswgqnaLyznPEQ9xt5PVQmGrVXe44TPw9UDdeeW9wEzyVx4BHkC36LgHkbhWM36mAAfSDvFAxrDaBEBGEPt3wrJct8A6C4osCpcvUDRqKCPg2PkgrcYuem"

describe("Commitment Scanner Utils test", () => {
    describe("checkTx", () => {
        it("should be undefined", async () => {
            const networkApi: ErgoNetworkApi = new ErgoNetworkApi()
            chai.spy.on(networkApi, 'getTxMetaData', () => [tx1])
            const commitment = await CommitmentUtils.checkTx(txId1, [commitmentAddress], networkApi);
            expect(commitment).to.be.undefined
        });
        it("should be commitment", async () => {
            const networkApi: ErgoNetworkApi = new ErgoNetworkApi()
            chai.spy.on(networkApi, 'getTxMetaData', () => [tx2])
            const commitment = await CommitmentUtils.checkTx(txId1, [commitmentAddress], networkApi);
            expect(commitment).to.not.be.undefined;
            expect(commitment?.WID).to.eql("799ed224b5705537168704da4f9ce0611b490734987b9ac8597a0e9637cd4e5b")
            expect(commitment?.eventId).to.eql("a59a20ce02b88b6dc0d96aac407840b7592ef4becf7172cca86c10b8286f77a9")
            expect(commitment?.commitment).to.eql("5ee69a1cee2a4ab85e0b4af9aab3d4c0212b13b8866798d39293cf4d7bf8f9d7")
        });
    });
    describe("commitmentAtHeight", () => {
        it("first index should be undefined and second be commitment", async () => {
            const networkApi: ErgoNetworkApi = new ErgoNetworkApi()
            chai.spy.on(networkApi, 'getBlockTxs', () => [1,2,3])
            chai.spy.on(networkApi, 'getTxMetaData', () => [tx1])
            const commitments = await CommitmentUtils.commitmentsAtHeight(
                "93395496d590ec6db0f2fd13a7bcf91e82a9f230ef677f6216ea8c9f57df6ab3"
                , networkApi
            );
            expect(commitments.length).to.be.equal(3);
        });
    })
})
