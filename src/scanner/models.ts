import { Observation } from "./utils";
import { DataSource, Entity, MoreThan, Repository } from "typeorm";
import { BlockEntity } from "../entity/BlockEntity";
import { Block } from "../objects/apiModels";
import { WatcherDataSource } from "../models/WatcherDataSource";
import { notEmpty } from "../utils/utils";
import { ObservationEntity } from "../entity/ObservationEntity";
import { CommitmentEntity } from "../entity/CommitmentEntity";

class DataBase {
    //TODO: should be added
    // 1- ConnectionManager
    // 2- Error handling throw
    // 3- connection should go to the config or env
    private dataSource: DataSource;
    private blockRepository: Repository<BlockEntity>;
    private commitmentRepository: Repository<CommitmentEntity>;

    constructor(dataSource: DataSource) {
        this.dataSource = dataSource;
        // console.log(this.blockRepository)
        this.blockRepository = this.dataSource.getRepository(BlockEntity);

    }


    getBlockHashT = async (blockHeight: number): Promise<string | undefined> => {
        return this.dataSource.initialize().then(async () => {
            const blockHash = await this.blockRepository.findOneBy({
                height: blockHeight,
            });
            return blockHash?.hash;
        });
    }

    getLastSavedBlock = (): Promise<Block | undefined> => {
        return this.dataSource.initialize().then(async () => {
            const lastBlock = await this.blockRepository.find({
                order: {height: 'DESC'},
                take: 1
            });
            if (lastBlock.length !== 0) {
                const block: Block = {hash: lastBlock[0].hash, block_height: lastBlock[0].height};
                return block;
            } else {
                return undefined;
            }
        });

        // //TODO: this is mocked
        // return new Promise((resolve, reject) => {
        //     setTimeout(() => {
        //         resolve({
        //             block_height: 3408016,
        //             hash: '5a1d652747fb39bff5f036f218e668ee6c403cc3ba609cc2d5b0d35f6599fd49'
        //         });
        //     }, 300);
        // });
    }

    changeLastValidBlock = (height: number) => {
        this.dataSource.initialize().then(async () => {
            await this.blockRepository.delete({
                height: MoreThan(height)
            });
        });
    }

    saveBlock = (height: number, blockHash: string, observations: Array<(Observation | undefined)>): Promise<boolean> => {
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
                return observationEntity;
            });
        return this.dataSource.initialize().then(async () => {
            const block = new BlockEntity();
            block.height = height;
            block.hash = blockHash;
            block.observations = observationsEntity;
            await this.blockRepository.save(block);
            return true;
        }).catch(() => false);
    }

    getCommitments = (eventId: string): Promise<string[]> => {
        return this.dataSource.initialize().then(async () => {
            const commitments = await this.commitmentRepository.findBy({
                eventId: eventId,
            });
            return commitments.map((commitment) => commitment.commitment);
        });
    }

    getBlockAtHeight = (height: number): Promise<Block> => {
        //TODO:Mocked
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve({
                    block_height: 3408015,
                    hash: '45c8ebd2c68b39c4c0fcbebae7cd3b03205edb0d5168062944c079d3a9dd52b2'
                });
            }, 300);
        });
    }


    getBlockHash = async (height: number): Promise<string> => {
        //TODO:Mocked
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve('5a1d652747fb39bff5f036f218e668ee6c403cc3ba609cc2d5b0d35f6599fd49');
            }, 300);
        });
    }
}

export default DataBase;

