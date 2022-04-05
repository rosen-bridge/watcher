import { Observation } from "./utils";
import { DataSource, DeleteResult, MoreThanOrEqual, Repository } from "typeorm";
import { BlockEntity } from "../entities/BlockEntity";
import { Block } from "../objects/apiModels";
import { ObservationEntity } from "../entities/ObservationEntity";
import { CommitmentEntity } from "../entities/CommitmentEntity";

class DataBase {

    private dataSource: DataSource;
    private blockRepository: Repository<BlockEntity>;
    private commitmentRepository: Repository<CommitmentEntity>;

    constructor(dataSource: DataSource) {
        this.dataSource = dataSource;
    }

    /**
     * init database connection
     * database should be init before any use
     */
    init = async () => {
        await this.dataSource
            .initialize()
            .then(() => {
                console.log("Data Source has been initialized!");
                this.blockRepository = this.dataSource.getRepository(BlockEntity);
            })
            .catch((err) => {
                console.error("Error during Data Source initialization:", err);
            });
    }

    /**
     * get last saved block
     * @return Promise<Block or undefined>
     */
    getLastSavedBlock = async (): Promise<Block | undefined> => {
        const lastBlock = await this.blockRepository.find({
            order: {height: 'DESC'},
            take: 1
        });
        if (lastBlock.length !== 0) {
            return {hash: lastBlock[0].hash, block_height: lastBlock[0].height};
        } else {
            return undefined;
        }
    }

    /**
     * it deletes every block that more than or equal height
     * @param height
     * @return Promise<DeleteResult>
     */
    changeLastValidBlock = async (height: number): Promise<DeleteResult> => {
        console.log()
        return await this.blockRepository.delete({
            height: MoreThanOrEqual(height)
        });
    }

    /**
     * save blocks with observation of that block
     * @param height
     * @param blockHash
     * @param observations
     * @return Promise<boolean>
     */
    saveBlock = async (height: number, blockHash: string, observations: Array<(Observation | undefined)>): Promise<boolean> => {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        const block = new BlockEntity();
        block.height = height;
        block.hash = blockHash;
        const observationsEntity = observations
            .filter(
                (block): block is Observation => block !== undefined).map((observation) => {
                const observationEntity = new ObservationEntity();
                observationEntity.fee = observation.fee;
                observationEntity.sourceBlockId = observation.sourceBlockId;
                observationEntity.amount = observation.amount;
                observationEntity.fromChain = observation.fromChain;
                observationEntity.toChain = observation.toChain;
                observationEntity.requestId = observation.requestId;
                observationEntity.sourceChainTokenId = observation.sourceChainTokenId;
                observationEntity.sourceTxId = observation.sourceTxId;
                observationEntity.toAddress = observation.toAddress;
                observationEntity.targetChainTokenId = observation.targetChainTokenId;
                observationEntity.block = block;
                return observationEntity;
            });

        let error = true;
        await queryRunner.startTransaction()
        try {
            await queryRunner.manager.save(block);
            await queryRunner.manager.save(observationsEntity);
            await queryRunner.commitTransaction();
        } catch (err) {
            await queryRunner.rollbackTransaction();
            error = false;
        } finally {
            await queryRunner.release();
        }
        return error;
    }

    /**
     * get block hash and height
     * @param height
     * @return Promise<Block|undefined>
     */
    getBlockAtHeight = async (height: number): Promise<Block | undefined> => {
        const blockHash = await this.blockRepository.findOneBy({
            height: height,
        });
        if (blockHash !== null) {
            return {hash: blockHash.hash, block_height: blockHash.height};
        } else {
            return undefined;
        }
    }

    /**
     * get commitments
     * @param eventId
     * @return Promise<string[]>
     */
    getCommitments = (eventId: string): Promise<string[]> => {
        return this.dataSource.initialize().then(async () => {
            const commitments = await this.commitmentRepository.findBy({
                eventId: eventId,
            });
            return commitments.map((commitment) => commitment.commitment);
        });
    }

}

export default DataBase;
