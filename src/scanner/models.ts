import { Observation } from "./utils";
import { DataSource, DeleteResult, Entity, getRepository, MoreThan, MoreThanOrEqual, Repository } from "typeorm";
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

    changeLastValidBlock = async (height: number): Promise<DeleteResult> => {
        return await this.blockRepository.delete({
            height: MoreThanOrEqual(height)
        });
    }

    saveBlock = async (height: number, blockHash: string, observations: Array<(Observation | undefined)>): Promise<boolean> => {
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

        const block = new BlockEntity();
        block.height = height;
        block.hash = blockHash;
        block.observations = observationsEntity;
        const res = await this.blockRepository.save(block);
        return "height" in res;

    }

    getCommitments = (eventId: string): Promise<string[]> => {
        return this.dataSource.initialize().then(async () => {
            const commitments = await this.commitmentRepository.findBy({
                eventId: eventId,
            });
            return commitments.map((commitment) => commitment.commitment);
        });
    }

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


}

export default DataBase;

