import { DataSource, DeleteResult, MoreThanOrEqual, Repository } from "typeorm";
import { BlockEntity } from "../entities/watcher/network/BlockEntity";
import { ObservationEntity } from "../entities/watcher/network/ObservationEntity";
import { Block, Observation } from "../objects/interfaces";
import { AbstractDataBase } from "./abstractModel";
import { TxEntity, TxType } from "../entities/watcher/network/TransactionEntity";

export class NetworkDataBase extends AbstractDataBase<BlockEntity, Array<Observation>> {
    dataSource: DataSource;
    blockRepository: Repository<BlockEntity>;
    observationRepository: Repository<ObservationEntity>;
    txRepository: Repository<TxEntity>

    private constructor(dataSource: DataSource) {
        super()
        this.dataSource = dataSource;
        this.blockRepository = this.dataSource.getRepository(BlockEntity);
        this.observationRepository = this.dataSource.getRepository(ObservationEntity);
        this.txRepository = this.dataSource.getRepository(TxEntity);
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
                observationEntity.networkFee = observation.networkFee;
                observationEntity.bridgeFee = observation.bridgeFee;
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
     * returns confirmed observation after required confirmation
     * @param confirmation
     */
    getConfirmedObservations = async (confirmation: number): Promise<Array<ObservationEntity>> => {
        const lastSavedBlock = await this.getLastSavedBlock()
        if(!lastSavedBlock){
            console.log("Error finding last saved block")
            throw new Error("last block not found")
        }
        const height: number = lastSavedBlock.block_height
        const requiredHeight = height - confirmation
        return await this.observationRepository.createQueryBuilder("observation_entity")
            .where("observation_entity.block < :requiredHeight", {requiredHeight})
            .getMany()
    }

    /**
     * Save a newly created commitment and updates the related observation
     * @param commitmentBoxId
     * @param observation
     */
    updateObservation = async (commitmentBoxId: string, observation: ObservationEntity) => {
        const newObservation = new ObservationEntity()
        Object.assign(newObservation, {
            ...observation,
            ...{
                commitmentBoxId: commitmentBoxId
            }
        })
        return this.observationRepository.save(newObservation)
    }

    /**
     * Stores a transaction in tx queue, the queue will process the transaction automatically afterward
     * @param tx
     * @param requestId
     * @param txId
     * @param time
     * @param type
     */
    submitTx = async (tx: string, requestId: string, txId: string, time: number, type: TxType) => {
        const txEntity = new TxEntity()
        txEntity.txId = txId
        txEntity.txSerialized = tx
        txEntity.creationTime = time
        txEntity.requestId = requestId
        txEntity.type = type
        return await this.txRepository.save(txEntity)
    }

    /**
     * Returns all stored transactions
     */
    getAllTxs = async (): Promise<Array<TxEntity>> => {
        return await this.txRepository.find()
    }

    /**
     * Removes one specified transaction
     * @param id
     */
    removeTx = async (id: number) => {
        await this.txRepository.delete({id: id})
    }
}

