import { ErgoConfig } from "./config/config";
import { boxesObject, databaseConnection } from "./index";
import { CommitmentReveal } from "./transactinos/commitmentReveal";

const ergoConfig = ErgoConfig.getConfig();
let commitmentRevealingObj: CommitmentReveal

const revealJob = () => {
    commitmentRevealingObj.job().then(() => setTimeout(revealJob, ergoConfig.commitmentRevealInterval * 1000))
}

export const reveal = () => {
    commitmentRevealingObj = new CommitmentReveal(databaseConnection, boxesObject)
    revealJob()
}

reveal()
