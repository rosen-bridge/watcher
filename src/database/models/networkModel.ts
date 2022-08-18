import { DataSource, Repository } from "typeorm";
import { ErgoNetwork } from "../../ergo/network/ergoNetwork";
import { ObservationEntity } from "@rosen-bridge/observation-extractor";
import { TxEntity, TxType } from "../entities/TxEntity";
import { ObservationStatusEntity, TxStatus } from "../entities/ObservationStatusEntity";


class NetworkDataBase{
    private readonly observationRepository: Repository<ObservationEntity>;
    private readonly txRepository: Repository<TxEntity>;
    private readonly observationStatusEntity: Repository<ObservationStatusEntity>;

    constructor(dataSource: DataSource) {
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

    /**
     * returns confirmed observation after required confirmation
     * ignores observations which have created commitments
     * @param confirmation
     * @param height
     */
    getConfirmedObservations = async (confirmation: number, height: number) => {
        const requiredHeight = height - confirmation;
        const temp = await this.observationRepository.createQueryBuilder('observation_entity')
            .where('observation_entity.height < :requiredHeight', {requiredHeight})
            .getMany()
        return temp;
    }

    /**
     * setting NOT_COMMITTED status for observations that doesn't have status and return last status
     * @param observation
     * @param status
     */
    setStatusForObservations = async (observation: ObservationEntity, status: TxStatus = TxStatus.NOT_COMMITTED): Promise<ObservationStatusEntity> => {
        const observationStatus = await this.getStatusForObservations(observation);
        if (!observationStatus) {
            return await this.observationStatusEntity.save({
                observation: observation,
                status: status
            });

        } else {
            return observationStatus
        }
    }

    getStatusForObservations = async (observation: ObservationEntity) => {
        return await this.observationStatusEntity.findOne(
            {
                where: {
                    observation: observation
                }
            });
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
        return this.observationStatusEntity.save({
            id: observationStatus.id,
            status: observationStatus.status + 1
        });
    }

    /**
     * Downgrades the observation TxStatus, it means it had problems creating or sending transactions
     * @param observation
     */
    downgradeObservationTxStatus = async (observation: ObservationEntity) => {
        const observationStatus = await this.getStatusForObservations(observation);
        if (observationStatus === null)
            throw new Error(`observation with requestId ${observation.requestId} has no status`)
        return this.observationStatusEntity.save({
            id: observationStatus.id,
            status: observationStatus.status - 1
        });

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
        return this.observationStatusEntity.save({
            id: observationStatus.id,
            status: status
        });
    }
}

export { NetworkDataBase }
