import { DataSource, Repository } from "typeorm";
import { ErgoNetwork } from "../../ergo/network/ergoNetwork";
import { ObservationEntity } from "@rosen-bridge/observation-extractor";
import { TxEntity, TxType } from "../entities/TxEntity";
import { ObservationStatusEntity, TxStatus } from "../entities/ObservationStatusEntity";
import { BlockEntity } from "@rosen-bridge/scanner";
import { Config } from "../../config/config";
import { PROCEED } from "@rosen-bridge/scanner/entities/blockEntity";

const config = Config.getConfig()

class NetworkDataBase{
    private readonly blockRepository: Repository<BlockEntity>
    private readonly observationRepository: Repository<ObservationEntity>;
    private readonly txRepository: Repository<TxEntity>;
    private readonly observationStatusEntity: Repository<ObservationStatusEntity>;

    constructor(dataSource: DataSource) {
        this.blockRepository = dataSource.getRepository(BlockEntity)
        this.observationRepository = dataSource.getRepository(ObservationEntity);
        this.txRepository = dataSource.getRepository(TxEntity);
        this.observationStatusEntity = dataSource.getRepository(ObservationStatusEntity);
    }

    /**
     * getter function for observationRepository
     */
    getObservationRepository = () => {
        return this.observationRepository;
    }

    /**
     * getter function for observationStatusEntity
     */
    getObservationStatusEntity = () => {
        return this.observationStatusEntity;
    }

    getLastBlockHeight = async (): Promise<number> => {
        let scanner
        if(config.networkWatcher == "Cardano") scanner = "cardano-koios"
        else if(config.networkWatcher == "Ergo") scanner = "ergo-node"
        else throw new Error("Network unrecognized")
        const lastBlock = await this.blockRepository.find({
            where: { status: PROCEED, scanner: scanner },
            order: { height: 'DESC' },
            take: 1
        });
        if (lastBlock.length !== 0) {
            return lastBlock[0].height;
        }
        throw new Error("No block found or error in database connection")
    }

    /**
     * returns confirmed observation after required confirmation
     * ignores observations which have created commitments
     * @param confirmation
     * @param height
     */
    getConfirmedObservations = async (confirmation: number, height: number) => {
        const requiredHeight = height - confirmation;
        return await this.observationRepository.createQueryBuilder('observation_entity')
            .where('observation_entity.height < :requiredHeight', {requiredHeight})
            .getMany()
    }

    /**
     * setting NOT_COMMITTED status for observations that doesn't have status and return last status
     * @param observation
     * @param status
     */
    setStatusForObservations = async (observation: ObservationEntity, status: TxStatus = TxStatus.NOT_COMMITTED): Promise<ObservationStatusEntity> => {
        const observationStatus = await this.getStatusForObservations(observation);
        if (!observationStatus) {
            await this.observationStatusEntity.insert({
                observation: observation,
                status: status
            });
            const insertedStatus = await this.getStatusForObservations(observation);
            if (insertedStatus === null) {
                throw new Error(`observation status with requestId ${observation.requestId} doesn't inserted in the dataBase`);
            } else {
                return insertedStatus
            }
        } else {
            return observationStatus
        }
    }

    /**
     * Checking that if observation has status in observationStatus table or not
     * @param observation
     */
    getStatusForObservations = async (observation: ObservationEntity): Promise<ObservationStatusEntity | null> => {
        return await this.observationStatusEntity.findOne(
            {
                where: {
                    observation: observation
                }
            })
    }

    /**
     * Stores a transaction in tx queue, the queue will process the transaction automatically afterward
     * @param tx
     * @param requestId
     * @param txId
     * @param txType
     */
    submitTx = async (tx: string, requestId: string, txId: string, txType: TxType) => {
        const observation: ObservationEntity | null = (await this.observationRepository.findOne({
            where: {requestId: requestId}
        }));
        if (!observation) throw new Error("Observation with this request id is not found");
        const observationStatus = await this.getStatusForObservations(observation);
        if (observationStatus === null)
            throw new Error(`observation with requestId ${observation.requestId} has no status`)
        const height = await ErgoNetwork.getHeight();
        const time = new Date().getTime();
        return await this.txRepository.insert({
            txId: txId,
            txSerialized: tx,
            creationTime: time,
            updateBlock: height,
            observation: observation,
            type: txType,
            deleted: false
        });
    }

    /**
     * Returns all stored transactions with no deleted flag
     */
    getAllTxs = async () => {
        return await this.txRepository.createQueryBuilder("tx_entity")
            .leftJoinAndSelect("tx_entity.observation", "observation_entity")
            .where("tx_entity.deleted == false")
            .getMany()
    }

    /**
     * Removes one specified transaction (Just toggles the removed flag)
     * @param tx
     */
    removeTx = async (tx: TxEntity) => {
        tx.deleted = true
        return this.txRepository.save(tx)
    }

    /**
     * Updates the tx checking time
     * @param tx
     * @param height
     */
    setTxUpdateHeight = async (tx: TxEntity, height: number) => {
        tx.updateBlock = height
        return this.txRepository.save(tx)
    }

    /**
     * Upgrades the observation TxStatus, it means it had progressed creating transactions
     * @param observation
     */
    upgradeObservationTxStatus = async (observation: ObservationEntity) => {
        const observationStatus = await this.getStatusForObservations(observation);
        if (observationStatus === null)
            throw new Error(`observation with requestId ${observation.requestId} has no status`)
        await this.observationStatusEntity.update({
                id: observationStatus.id
            }, {
                status: observationStatus.status + 1
            }
        )
        const updatedStatus = await this.getStatusForObservations(observation);
        if (updatedStatus === null) {
            throw new Error(`observation status with requestId ${observation.requestId} doesn't inserted in the dataBase`);
        } else {
            return updatedStatus
        }
    }

    /**
     * Downgrades the observation TxStatus, it means it had problems creating or sending transactions
     * @param observation
     */
    downgradeObservationTxStatus = async (observation: ObservationEntity) => {
        const observationStatus = await this.getStatusForObservations(observation);
        if (observationStatus === null)
            throw new Error(`observation with requestId ${observation.requestId} has no status`)
        await this.observationStatusEntity.update({
                id: observationStatus.id
            }, {
                status: observationStatus.status - 1
            }
        )
        const updatedStatus = await this.getStatusForObservations(observation);
        if (updatedStatus === null) {
            throw new Error(`observation status with requestId ${observation.requestId} doesn't inserted in the dataBase`);
        } else {
            return updatedStatus
        }

    }

    /**
     * Update the observation TxStatus to the specified new status
     * @param observation
     * @param status
     */
    updateObservationTxStatus = async (observation: ObservationEntity, status: TxStatus) => {
        const observationStatus = await this.getStatusForObservations(observation);
        if (observationStatus === null)
            throw new Error(`observation with requestId ${observation.requestId} has no status`)
        await this.observationStatusEntity.update({
                id: observationStatus.id
            }, {
                status: status
            }
        )
        const updatedStatus = await this.getStatusForObservations(observation);
        if (updatedStatus === null) {
            throw new Error(`observation status with requestId ${observation.requestId} doesn't inserted in the dataBase`);
        } else {
            return updatedStatus
        }
    }
}

export { NetworkDataBase }
