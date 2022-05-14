import {ErgoNetworkApi} from "../../../src/commitments/network/networkApi";
import {CommitmentUtils} from "../../../src/commitments/scanner/utils";
import {expect} from "chai";
import {NodeTransaction} from "../../../src/commitments/network/ergoApiModels";
import {CommitmentDataBase} from "../../../src/models/commitmentModel";
import {commitmentOrmConfig} from "../../../config/ormconfig";

const chai = require("chai")
const spies = require("chai-spies")
chai.use(spies);

const ergoNetwork = new ErgoNetworkApi();
const tx = require('../dataset/tx.json');
const commitmentTx = require('../dataset/commitmentTx.json');
const txId1 = "7aa6b32b1eb5401039340ed3cace93d004aa513f33053c0bd7162beb4695ecf6"
const commitmentAddress = "EurZwDoNTXuraUu37sjKwpEPkoumCwXHrwk8jUZzRCVyrrDywfQsbXSfh4sD9KYuNw3sqJDyKqh9URkzGTKzpFU28hWx2uUJJVhJ6LigNANqfVVjEFf4g5kkwTqLES4CpAyNLv3v8tBgtB2kGzjMZpU3qbwpZ8eh4JQQUw5cztzXc715H61hqPTH13i1qfGdph8GLV8DkczLHGektosSWXNQRXJBRvH6DVuyPRYsEeyjYr4agBxyEZ5PTx7KgYwKGFWhKbgkdaLzySZjFV7bSZXArLGpykP1UgS62o6aBydg1oPM3PTFugHQJbtusQShDNGCu5V7XXfePtJ2ybhS32NT3vP15Lzf1sXwXerGbMWLiznyLc4op1TJd5LyWrCYtznhwmjEZ7iKBxNT49BuL5QBQ3RiFFmazkhXrLLQnnqmhBfH8s8yA6rQD8hmyFm5YCaTfBPTG1LznGWtw6G9h5pZnAMuqHBBsEnKjRArTTR7uabKTCBK11oaVo8bqh3JPpHumLv7YAiC1GDHYst7KoVct9vwF5kByEag6turXiWA1JH4KNayh4VVwz8PLcGx5eyThMLkNw6t1VApcgM6DehcMhCc5D5jW4MicKrvwwYTEU4qwfHjMQ1ftanb7pRZkDZPuL9qppvQZhDdM8DzgXdMGnJK44aXujkuWZFvzKVzpPVyswgqnaLyznPEQ9xt5PVQmGrVXe44TPw9UDdeeW9wEzyVx4BHkC36LgHkbhWM36mAAfSDvFAxrDaBEBGEPt3wrJct8A6C4osCpcvUDRqKCPg2PkgrcYuem"

describe("Commitment Scanner Utils test", () => {
    describe("checkTx", () => {
        it("should be undefined", async () => {
            const commitment = await CommitmentUtils.checkTx(tx, [commitmentAddress]);
            expect(commitment).to.be.undefined
        });
        it("should be commitment", async () => {
            const commitment = await CommitmentUtils.checkTx(commitmentTx, [commitmentAddress]);
            expect(commitment).to.not.be.undefined;
            expect(commitment?.WID).to.eql("f875d3b916e56056968d02018133d1c122764d5c70538e70e56199f431e95e9b")
            expect(commitment?.eventId).to.eql("ab59962c20f57d9d59e95f5170ccb3472df4279ad4967e51ba8be9ba75144c7b")
            expect(commitment?.commitment).to.eql("c0666e24aa83e38b3955aae906140bda7f2e1974aca897c28962e7eaebd84026")
        });
    });

    describe("commitmentAtHeight", () => {
        it("first index should be undefined and second be commitment", async () => {
            const DB = await CommitmentDataBase.init(commitmentOrmConfig);
            chai.spy.on(DB, 'findCommitmentsById', () => [1,2,3])
            chai.spy.on(DB, 'updateSpentCommitment')
            const commitments = await CommitmentUtils.commitmentsAtHeight(
                [commitmentTx]
                , DB,
                10
            );
            expect(commitments.length).to.be.equal(1);
        });
    })
})
