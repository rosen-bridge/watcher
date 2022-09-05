import { Config } from "../config/config";
import { CommitmentReveal } from "../transactions/commitmentReveal";
import { Boxes } from "../ergo/boxes";
import { TransactionUtils, WatcherUtils } from "../utils/watcherUtils";

const config = Config.getConfig();
let commitmentRevealingObj: CommitmentReveal

const revealJob = () => {
    commitmentRevealingObj.job().then(() => setTimeout(revealJob, config.commitmentRevealInterval * 1000))
}

export const reveal = (watcherUtils: WatcherUtils, txUtils: TransactionUtils, boxes: Boxes) => {
    commitmentRevealingObj = new CommitmentReveal(watcherUtils, txUtils, boxes)
    revealJob()
}
