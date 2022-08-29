import { Config } from "../config/config";
import { boxesObject, databaseConnection } from "../index";
import { CommitmentReveal } from "../transactions/commitmentReveal";

const config = Config.getConfig();
let commitmentRevealingObj: CommitmentReveal

const revealJob = () => {
    commitmentRevealingObj.job().then(() => setTimeout(revealJob, config.commitmentRevealInterval * 1000))
}

export const reveal = () => {
    commitmentRevealingObj = new CommitmentReveal(databaseConnection, boxesObject)
    revealJob()
}
