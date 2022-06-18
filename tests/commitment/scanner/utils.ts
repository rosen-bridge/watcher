import { CommitmentUtils } from "../../../src/commitments/scanner/utils";
import { expect } from "chai";
import { ErgoConfig } from "../../../src/config/config"
import { loadDataBase } from "../models/commitmentModel";
import { boxType } from "../../../src/entities/BoxEntity";

const chai = require("chai")
const sinon = require("sinon");
const spies = require("chai-spies")
chai.use(spies);

const tx = require('../dataset/tx.json');
const commitmentTx = require('../dataset/commitmentTx.json');
const commitmentAddress = "EurZwDoNTXuraUu37sjKwpEPkoumCwXHrwk8jUZzRCVyrrDywfQsbXSfh4sD9KYuNw3sqJDyKqh9URkzGTKzpFU28hWx2uUJJVhJ6LigNANqfVVjEFf4g5kkwTqLES4CpAyNLv3v8tBgtB2kGzjMZpU3qbwpZ8eh4JQQUw5cztzXc715H61hqPTH13i1qfGdph8GLV8DkczLHGektosSWXNQRXJBRvH6DVuyPRYsEeyjYr4agBxyEZ5PTx7KgYwKGFWhKbgkdaLzySZjFV7bSZXArLGpykP1UgS62o6aBydg1oPM3PTFugHQJbtusQShDNGCu5V7XXfePtJ2ybhS32NT3vP15Lzf1sXwXerGbMWLiznyLc4op1TJd5LyWrCYtznhwmjEZ7iKBxNT49BuL5QBQ3RiFFmazkhXrLLQnnqmhBfH8s8yA6rQD8hmyFm5YCaTfBPTG1LznGWtw6G9h5pZnAMuqHBBsEnKjRArTTR7uabKTCBK11oaVo8bqh3JPpHumLv7YAiC1GDHYst7KoVct9vwF5kByEag6turXiWA1JH4KNayh4VVwz8PLcGx5eyThMLkNw6t1VApcgM6DehcMhCc5D5jW4MicKrvwwYTEU4qwfHjMQ1ftanb7pRZkDZPuL9qppvQZhDdM8DzgXdMGnJK44aXujkuWZFvzKVzpPVyswgqnaLyznPEQ9xt5PVQmGrVXe44TPw9UDdeeW9wEzyVx4BHkC36LgHkbhWM36mAAfSDvFAxrDaBEBGEPt3wrJct8A6C4osCpcvUDRqKCPg2PkgrcYuem"
const permitAddress = "EE7687i4URb4YuSGSQXPCb6iAFxAd5s8H1DLbUFQnSrJ8rED2KXdq8kUPQZ3pcPVFD97wQ32PATufWyvyhvit6sokNfLUMPqCZeVN85foTQx6zae88o2T8V9B1LqKtuZsxKG94hKxSoWmTTVUhy9TYiYhJUackckhwWi8LzbLYaVmozJRFgq4RXgzsa4bRTcQrp5fZjBmfDxgfbTyUt4JaVATkdRsDL41QKcXaq5Sds49beNhBaV8KqhY4Rj9muYfLoEvf3T4yX56YwhwQibXSWHKZpbXKYasRZ6NooQyP6XnjLcfLx2KzGoNJSoZNHih5YR9Heo7v3CHYDUur1dC8KT2ibKkA21SYyYZ4i1dQgsSjqx3QwpV6Yo6k87T4tvPeKNoHj47G4bUmGk4kuKZo2NQQXLfBsXLyELaGqbWAMJtzVwvDUQXAhWTXUkgQo9VnzWAoXkkt9oDUE8qFh1FRRfqeKaXkMY1ZxvkJa9AeZnssfoYEoDzqgkt7Nfziw5xgMJDDCRgZyZgN1CC3qaDH319gnE6aCMib5pnyY"
const watcherAddress = "9f5veZdZq1C15GCqm6uej3kpRPh3Eq1Mtk1TqWjQx3CzMEZHXNz"
const WID = "f875d3b916e56056968d02018133d1c122764d5c70538e70e56199f431e95e9b"

describe("Commitment Scanner Utils test", () => {
    describe("checkTx", () => {
        it("should be undefined", async () => {
            const commitment = await CommitmentUtils.checkTx(tx, [commitmentAddress]);
            expect(commitment).to.be.undefined
        });
        it("should be commitment", async () => {
            commitmentTx.outputs[1].assets[0].tokenId = ErgoConfig.getConfig().RWTId
            const commitment = await CommitmentUtils.checkTx(commitmentTx, [commitmentAddress]);
            expect(commitment).to.not.be.undefined;
            expect(commitment?.WID).to.eql("f875d3b916e56056968d02018133d1c122764d5c70538e70e56199f431e95e9b")
            expect(commitment?.eventId).to.eql("ab59962c20f57d9d59e95f5170ccb3472df4279ad4967e51ba8be9ba75144c7b")
            expect(commitment?.commitment).to.eql("c0666e24aa83e38b3955aae906140bda7f2e1974aca897c28962e7eaebd84026")
        });
    });

    describe("commitmentAtHeight", () => {
        it("Should find one valid commitment", async () => {
            chai.spy.on(CommitmentUtils, 'checkTx', () => [{}])
            const commitments = await CommitmentUtils.commitmentsAtHeight(
                [commitmentTx]
            );
            expect(commitments.length).to.be.equal(1);
        });
    })

    describe("updatedCommitmentsAtHeight", () => {
        it("should find 1 updated commitments", async () => {
            const DB = await loadDataBase("commitments");
            chai.spy.on(DB, 'findCommitmentsById', () => [])
            const data = await CommitmentUtils.updatedCommitmentsAtHeight(
                [commitmentTx],
                DB,
                ["cea4dacf032e7e152ea0a5029fe6a84d685d22f42f7137ef2735ce90663192d7"]
            );
            expect(data.length).to.be.equal(1);
            expect(data[0]).to.eql("cea4dacf032e7e152ea0a5029fe6a84d685d22f42f7137ef2735ce90663192d7")
        });
    })

    describe("specialBoxesAtHeight", () => {
        it("Should find one permit box and one WID box", async () => {
            commitmentTx.outputs[0].assets[0].tokenId = ErgoConfig.getConfig().RWTId
            const specialBoxes = await CommitmentUtils.specialBoxesAtHeight(
                [commitmentTx],
                permitAddress,
                watcherAddress,
                WID
            );
            expect(specialBoxes.length).to.be.equal(2);
            expect(specialBoxes[0].type).to.eq(boxType.PERMIT)
            expect(specialBoxes[1].type).to.eq(boxType.WID)
        });
        it("Should find one plain watcher box", async () => {
            const specialBoxes = await CommitmentUtils.specialBoxesAtHeight(
                [tx],
                permitAddress,
                watcherAddress,
                WID
            );
            expect(specialBoxes.length).to.be.equal(1);
            expect(specialBoxes[0].type).to.eq(boxType.PLAIN)
        });
    })

    describe("spentSpecialBoxesAtHeight", () => {
        it("should find 2 updated boxes", async () => {
            const DB = await loadDataBase("commitments");
            chai.spy.on(DB, 'findUnspentSpecialBoxesById', () => [{boxId: "cea4dacf032e7e152ea0a5029fe6a84d685d22f42f7137ef2735ce90663192d7"}])
            const data = await CommitmentUtils.spentSpecialBoxesAtHeight(
                [commitmentTx],
                DB,
                ["cd0e9ad2ae564768bc6bf74a350934117040686fd267f313fce27d7df00fe549"]
            );
            expect(data.length).to.be.equal(2);
            expect(data[0]).to.eql("cea4dacf032e7e152ea0a5029fe6a84d685d22f42f7137ef2735ce90663192d7")
            expect(data[1]).to.eql("cd0e9ad2ae564768bc6bf74a350934117040686fd267f313fce27d7df00fe549")
        });
    })
})
