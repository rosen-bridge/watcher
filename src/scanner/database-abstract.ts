import { Block } from "../objects/apiModels";
import { DeleteResult } from "typeorm";
import { Observation } from "./utils";

export abstract class DatabaseAbstract {
    abstract async getLastSavedBlock(): Promise<Block | undefined>;

    abstract async changeLastValidBlock(height: number): Promise<DeleteResult>;

    abstract async saveBlock(height: number, blockHash: string, observations: Array<(Observation | undefined)>): Promise<boolean>;

    abstract async getBlockAtHeight(height: number): Promise<Block | undefined>;

    abstract async getCommitments(eventId: string): Promise<string[]>;
}

