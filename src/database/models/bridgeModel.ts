import { DataSource, In, Repository } from "typeorm";
import { BoxEntity } from "@rosen-bridge/address-extractor";
import { PermitEntity, CommitmentEntity, EventTriggerEntity } from "@rosen-bridge/watcher-data-extractor";
import { Config } from "../../config/config";

const config = Config.getConfig()

class BridgeDataBase{
    commitmentRepository: Repository<CommitmentEntity>;
    permitRepository: Repository<PermitEntity>;
    boxRepository: Repository<BoxEntity>;
    eventTriggerRepository: Repository<EventTriggerEntity>

    constructor(dataSource: DataSource) {
        this.commitmentRepository = dataSource.getRepository(CommitmentEntity);
        this.permitRepository = dataSource.getRepository(PermitEntity);
        this.boxRepository = dataSource.getRepository(BoxEntity);
        this.eventTriggerRepository = dataSource.getRepository(EventTriggerEntity)
    }

    /**
     * returns old spent commitments
     * @param height
     */
    getOldSpentCommitments = async (height: number) => {
        return await this.commitmentRepository.createQueryBuilder("commitment_entity")
            .where("commitment_entity.spendBlockHeight < :height", {height})
            .getMany()
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
    findCommitmentsById = async (ids: Array<string>): Promise<Array<CommitmentEntity>> => {
        return await this.commitmentRepository.find({
            where: {
                commitmentBoxId: In(ids)
            }
        })
    }

    /**
     * Returns all commitments related to a specific event
     * @param eventId
     */
    commitmentsByEventId = async (eventId: string): Promise<Array<CommitmentEntity>> => {
        return await this.commitmentRepository.find({
            where: {
                eventId: eventId
            }
        })
    }

    /**
     * Returns all unspent permit boxes
     */
    getUnspentPermitBoxes = async (wid: string): Promise<Array<PermitEntity>> => {
        return this.permitRepository.createQueryBuilder("permit_entity")
            .where("WID == :wid", {wid})
            .andWhere("spendBlockHash is null")
            .getMany()
    }

    /**
     * Returns all unspent plain boxes
     */
    getUnspentAddressBoxes = async (): Promise<Array<BoxEntity>> => {
        return this.boxRepository.createQueryBuilder("box_entity")
            .where("spendBlock is null", )
            .getMany()
    }

    /**
     * Returns an eventTriggerEntity with the specified sourceTxId
     * @param sourceTxId
     */
    eventTriggerBySourceTxId = async (sourceTxId: string): Promise<EventTriggerEntity | null> => {
        return await this.eventTriggerRepository.findOne({
            where: {
                sourceTxId: sourceTxId
            }
        })
    }
}

export { BridgeDataBase }
