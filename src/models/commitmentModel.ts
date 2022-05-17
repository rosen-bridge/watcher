import {DataSource, DeleteResult, In, LessThan, MoreThanOrEqual, Repository} from "typeorm";
import {CBlockEntity} from "../entities/CBlockEntity";
import {ObservedCommitmentEntity} from "../entities/ObservedCommitmentEntity";
import { Block, Commitment } from "../objects/interfaces";
import {AbstractDataBase} from "./abstractModel";
import {commitmentInformation} from "../commitments/scanner/scanner";
import {CommitmentEntity} from "../entities/CommitmentEntity";

export class CommitmentDataBase extends AbstractDataBase<CBlockEntity, commitmentInformation> {
    dataSource: DataSource;
    blockRepository: Repository<CBlockEntity>;
    commitmentRepository: Repository<ObservedCommitmentEntity>

    private constructor(dataSource: DataSource) {
        super()
        this.dataSource = dataSource;
        this.blockRepository = this.dataSource.getRepository(CBlockEntity);
        this.commitmentRepository = this.dataSource.getRepository(ObservedCommitmentEntity);
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
        return new CommitmentDataBase(dataSource);
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
     * @param information
     * @return Promise<boolean>
     */
    saveBlock = async (height: number, blockHash: string, information: commitmentInformation): Promise<boolean> => {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        const block = new CBlockEntity();
        block.height = height;
        block.hash = blockHash;
        const commitmentsEntity = information.newCommitments
            .map((commitment) => {
                const commitmentEntity = new ObservedCommitmentEntity();
                commitmentEntity.eventId = commitment.eventId
                commitmentEntity.commitment = commitment.commitment
                commitmentEntity.WID = commitment.WID
                commitmentEntity.commitmentBoxId = commitment.commitmentBoxId
                commitmentEntity.block = block
                return commitmentEntity;
            });

        const updatedCommitmentEntities: Array<ObservedCommitmentEntity> = []
        for(const boxId of information.newCommitments){
            const oldCommitment = await this.commitmentRepository.findOne({
                where: { commitmentBoxId: information.updatedCommitments[0] }
            })
            const newCommitment = new ObservedCommitmentEntity()
            Object.assign(newCommitment, {
                ...oldCommitment,
                ...{
                    commitmentBoxId: information.updatedCommitments[0],
                    spendBlock: block
                }
            })
            updatedCommitmentEntities.push(newCommitment)
        }

        let error = true;
        await queryRunner.startTransaction()
        try {
            await queryRunner.manager.save(block);
            await queryRunner.manager.save(commitmentsEntity);
            await queryRunner.manager.save(updatedCommitmentEntities);
            await queryRunner.commitTransaction();
        } catch (err) {
            await queryRunner.rollbackTransaction();
            console.log(err)
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
     * returns old spent commitments
     * @param height
     */
    getOldSpentCommitments = async (height: number): Promise<Array<Commitment>> =>{
        return await this.commitmentRepository.find({
            where: {
                spendBlock: LessThan(height)
            }
        })
    }

    /**
     * delete commitments by their box ids
     * @param ids
     */
    deleteCommitments = async (ids: Array<string>) => {
        await this.commitmentRepository.delete({commitmentBoxId: In(ids)})
    }

    /**
     * find commitments by their box ids
     * @param ids
     */
    findCommitmentsById = async (ids: Array<string>) => {
        return await this.commitmentRepository.find({
            where: {
                commitmentBoxId: In(ids)
            }
        })
    }
}

