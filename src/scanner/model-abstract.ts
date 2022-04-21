import { Block } from "../objects/apiModelsCardano";
import { DataSource, DeleteResult, Repository } from "typeorm";
import { Observation } from "./utils";

export abstract class modelAbstract {
    abstract getLastSavedBlock(): Promise<Block | undefined>;

    abstract changeLastValidBlock(height: number): Promise<DeleteResult>;

    abstract saveBlock(height: number, blockHash: string, observations: Array<(Observation | undefined)>): Promise<boolean>;

    abstract getBlockAtHeight(height: number): Promise<Block | undefined>;

    abstract getCommitments(eventId: string): Promise<string[]>;
}

