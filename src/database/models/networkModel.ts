import { DataSource, Repository } from "typeorm";
import { ErgoNetwork } from "../../ergo/network/ergoNetwork";
import { ObservationEntity, TxStatus } from "@rosen-bridge/observation-extractor";
import { TxEntity, TxType } from "../entities/watcher/TxEntity";
import { ObservationStatusEntity } from "../entities/watcher/ObservationStatusEntity";


class NetworkDataBase{
    private observationRepository: Repository<ObservationEntity>;
    private txRepository: Repository<TxEntity>;
    private observationStatusRepository: Repository<ObservationStatusEntity>;

    constructor(dataSource: DataSource) {
        this.observationRepository = dataSource.getRepository(ObservationEntity);
        this.txRepository = dataSource.getRepository(TxEntity);
        this.observationStatusRepository = dataSource.getRepository(ObservationStatusEntity);
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
        const height = await ErgoNetwork.getHeight();
        const time = new Date().getTime();
        if (!observation) throw new Error("Observation with this request id is not found");
        const txStatus = new ObservationStatusEntity();
        txStatus.observation = observation;
        txStatus.status = TxStatus.NOT_COMMITTED;
        await this.observationStatusRepository.save(txStatus);
        const txEntity = new TxEntity();
        txEntity.txId = txId;
        txEntity.txSerialized = tx;
        txEntity.creationTime = time;
        txEntity.updateBlock = height;
        txEntity.observation = observation;
        txEntity.type = txType;
        txEntity.deleted = false;
        txEntity.status = txStatus;
        return await this.txRepository.save(txEntity);
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
        observation.status = observation.status + 1
        return this.observationRepository.save(observation)
    }

    /**
     * Downgrades the observation TxStatus, it means it had problems creating or sending transactions
     * @param observation
     */
    downgradeObservationTxStatus = async (observation: ObservationEntity) => {
        observation.status = observation.status - 1
        return this.observationRepository.save(observation)
    }

    /**
     * Update the observation TxStatus to the specified new status
     * @param observation
     * @param status
     */
    updateObservationTxStatus = async (observation: ObservationEntity, status: TxStatus) => {
        observation.status = status
        return this.observationRepository.save(observation)
    }
}

export { NetworkDataBase }
