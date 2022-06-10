import { DataSource, DeleteResult, MoreThanOrEqual, Repository } from "typeorm";
import { BlockEntity } from "../entities/BlockEntity";
import { CommitmentEntity, txStatus } from "../entities/CommitmentEntity";
import { ObservationEntity } from "../entities/ObservationEntity";
import { Block, Commitment, Observation } from "../objects/interfaces";
import { AbstractDataBase } from "./abstractModel";

export class NetworkDataBase extends AbstractDataBase<BlockEntity, Array<Observation>> {
    dataSource: DataSource;
    blockRepository: Repository<BlockEntity>;
    commitmentRepository: Repository<CommitmentEntity>;
    observationRepository: Repository<ObservationEntity>;

    private constructor(dataSource: DataSource) {
        super()
        this.dataSource = dataSource;
        this.blockRepository = this.dataSource.getRepository(BlockEntity);
        this.commitmentRepository = this.dataSource.getRepository(CommitmentEntity);
        this.observationRepository = this.dataSource.getRepository(ObservationEntity);
    }

    /**
     * init database connection & running migrations'
     * database should be init before any use
     */
    static init = async (dataSource: DataSource) => {
        await dataSource
            .initialize()
            .then(async () => {
                await dataSource.runMigrations()
                console.log("Data Source has been initialized!");
            })
            .catch((err) => {
                console.error("Error during Data Source initialization:", err);
            });
        return new NetworkDataBase(dataSource);
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
    removeForkedBlocks = async (height: number): Promise<DeleteResult> => {
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
    saveBlock = async (height: number, blockHash: string, observations: Array<Observation>): Promise<boolean> => {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        const block = new BlockEntity();
        block.height = height;
        block.hash = blockHash;
        const observationsEntity = observations
            .map((observation) => {
                const observationEntity = new ObservationEntity();
                observationEntity.fee = observation.fee;
                observationEntity.sourceBlockId = observation.sourceBlockId;
                observationEntity.amount = observation.amount;
                observationEntity.fromChain = observation.fromChain;
                observationEntity.toChain = observation.toChain;
                observationEntity.requestId = observation.requestId;
                observationEntity.sourceChainTokenId = observation.sourceChainTokenId;
                observationEntity.sourceTxId = observation.sourceTxId;
                observationEntity.fromAddress = observation.fromAddress;
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
    getCommitments = async (eventId: string): Promise<string[]> => {
        const commitments = await this.commitmentRepository.findBy({
            eventId: eventId,
        });
        return commitments.map((commitment) => commitment.commitment);
    }

    /**
     * returns confirmed observation after required confirmation
     * ignores unused observation where
     * @param confirmation
     */
    getConfirmedObservations = async (confirmation: number): Promise<Array<ObservationEntity>> => {
        const height: number = (await this.getLastSavedBlock())?.block_height!
        const requiredHeight = height - confirmation
        return await this.observationRepository.createQueryBuilder("observation_entity")
            .where("observation_entity.block < :requiredHeight", {requiredHeight})
            .getMany()
    }

    /**
     * Save a newly created commitment and updates the related observation
     * @param commitment
     * @param txId
     * @param observationId
     */
    saveCommitment = async (commitment: Commitment, txId: string, observationId: number) => {
        const commitmentEntity = new CommitmentEntity();
        commitmentEntity.eventId = commitment.eventId
        commitmentEntity.commitment = commitment.commitment
        commitmentEntity.WID = commitment.WID
        commitmentEntity.commitmentBoxId = commitment.commitmentBoxId
        commitmentEntity.commitmentTxId = txId
        commitmentEntity.flag = txStatus.SENT

        const oldObservation = await this.observationRepository.findOne({
            where: {id: observationId}
        })
        const newObservation = new ObservationEntity()
        Object.assign(newObservation, {
            ...oldObservation,
            ...{
                commitment: commitmentEntity
            }
        })
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();

        let error = true;
        await queryRunner.startTransaction()
        try {
            await queryRunner.manager.save(commitmentEntity);
            await queryRunner.manager.save(newObservation);
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
     * returns all created events by the watcher that are still valid
     */
    getCreatedCommitments = async (): Promise<Array<CommitmentEntity>> => {
        return await this.commitmentRepository.find({
            where: {
                flag: txStatus.CREATED
            }
        })
    }
}

