import { DataSource, DeleteResult, MoreThanOrEqual, Repository } from "typeorm";
import { BlockEntity } from "../entities/BlockEntity";
import { CommitmentEntity } from "../entities/CommitmentEntity";
import { ObservationEntity } from "../entities/ObservationEntity";
import { Block, Observation } from "../objects/interfaces";

export abstract class AbstractDataBase <BlockT, DataT>{
    abstract dataSource: DataSource;
    abstract blockRepository: Repository<BlockT>;

    /**
     * get last saved block
     * @return Promise<Block or undefined>
     */
    abstract getLastSavedBlock(): Promise<Block | undefined>;

    /**
     * it deletes every block that more than or equal height
     * @param height
     * @return Promise<DeleteResult>
     */
    abstract removeForkedBlocks(height: number): Promise<DeleteResult>;

    /**
     * save blocks with observation of that block
     * @param height
     * @param blockHash
     * @param data
     * @return Promise<boolean>
     */
    abstract saveBlock (height: number, blockHash: string, data: Array<(DataT | undefined)>): Promise<boolean>;

    /**
     * get block hash and height
     * @param height
     * @return Promise<Block|undefined>
     */
    abstract getBlockAtHeight (height: number): Promise<Block | undefined>;
}

