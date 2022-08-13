import { ErgoConfig } from "./config/config";
import { DataSource, Repository } from "typeorm";
import { fileURLToPath } from "url";
import path from "path";
// import { BlockEntity, ErgoScanner, migrations, CardanoKoiosScanner } from "@rosen-bridge/scanner";
import { BlockEntity, ErgoScanner, migrations, CardanoKoiosScanner } from "@rosen-bridge/scanner";
// import { CardanoObservationExtractor, ObservationEntity } from "@rosen-bridge/observation-extractor";
import { CardanoObservationExtractor, ObservationEntity } from "@rosen-bridge/observation-extractor";
import { migrations as observationMigration } from "@rosen-bridge/observation-extractor";
import tokens from './config/tokens.test.json' assert { type: "json" };
import { TxEntity, TxType } from "./entities/watcher/network/TransactionEntity";
import { ErgoNetwork } from "./ergo/network/ergoNetwork";
import { TxEntityTemp, TxTypeTemp } from "./transactionEntityTemp";
import { TxStatus } from "./entities/watcher/network/ObservationEntity";


const ergoConfig = ErgoConfig.getConfig();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ergoScannerDataSource = new DataSource({
    type: "sqlite",
    database: __dirname + "/../sqlite/ergoScanner.sqlite",
    entities: [BlockEntity],
    migrations: migrations,
    synchronize: false,
    logging: false,
});
await ergoScannerDataSource.initialize();
await ergoScannerDataSource.runMigrations();

const cardanoScannerDataSource = new DataSource({
    type: "sqlite",
    database: __dirname + "/../sqlite/cardanoScanner.sqlite",
    entities: [BlockEntity],
    migrations: migrations,
    synchronize: false,
    logging: false,
});
await cardanoScannerDataSource.initialize();
await cardanoScannerDataSource.runMigrations();


// CardanoKoiosScanner
// {
//     koiosUrl: string;
//     timeout: number;
//     initialHeight: number;
//     dataSource: DataSource;
// }

const cardanoScannerConfig = {
    koiosUrl: 'https://testnet.koios.rest/api/v0',
    timeout: 10000,
    initialHeight: 10000,
    dataSource: cardanoScannerDataSource,
}

const cardanoScanner = new CardanoKoiosScanner(cardanoScannerConfig);


const cardanoObservationDataSource = new DataSource({
    type: "sqlite",
    database: __dirname + "/../sqlite/cardanoObservations.sqlite",
    entities: [ObservationEntity],
    migrations: observationMigration,
    synchronize: false,
    logging: false,
});
await cardanoObservationDataSource.initialize();
await cardanoObservationDataSource.runMigrations();

const ergoScannerConfig = {
    // nodeUrl: ergoConfig.nodeUrl,
    nodeUrl: 'http://10.10.9.3:9065/',
    timeout: ergoConfig.nodeTimeout,
    initialHeight: 10000,
    dataSource: ergoScannerDataSource,
}

const ergoScanner = new ErgoScanner(ergoScannerConfig);
const cardanoObservationExtractor = new CardanoObservationExtractor(cardanoObservationDataSource, tokens);

cardanoScanner.registerExtractor(cardanoObservationExtractor);


const ergoScannerJob = async () => {
    // ergoScanner.update().then(() => setTimeout(ergoScannerJob, ergoConfig.bridgeScanInterval * 1000))
    ergoScanner.update().then(() => setTimeout(ergoScannerJob, 1 * 1000))
}

const cardanoScannerJob = async () => {
    await cardanoScanner.update().then(() => setTimeout(cardanoScannerJob, 10 * 1000))
}

class CardanoDataBase{
    private blockDataSource: DataSource;
    private observationDataSource: DataSource;
    private txDataSource: DataSource;
    private observationRepository: Repository<ObservationEntity>;
    private txRepository: Repository<TxEntityTemp>;


    constructor(blockDataSource: DataSource, observationDataSource: DataSource, txDataSource: DataSource) {
        this.blockDataSource = blockDataSource;
        this.observationDataSource = observationDataSource;
        this.observationRepository = observationDataSource.getRepository(ObservationEntity);
        this.txDataSource = txDataSource;
        this.txRepository = txDataSource.getRepository(TxEntityTemp);
    }

    /**
     * returns confirmed observation after required confirmation
     * ignores observations which have created commitments
     * @param confirmation
     */
    getConfirmedObservation = async (confirmation: number) => {
        const lastSavedBlock = await cardanoScanner.getLastSavedBlock();
        if (!lastSavedBlock) {
            console.log("Error finding last saved block")
            throw new Error("last block not found")
        }
        const height: number = lastSavedBlock.height;
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
    submitTx = async (tx: string, requestId: string, txId: string, txType: TxTypeTemp) => {
        const observation: ObservationEntity | null = (await this.observationRepository.findOne({
            where: {requestId: requestId}
        }));
        const height = await ErgoNetwork.getHeight();
        const time = new Date().getTime();
        if (!observation) throw new Error("Observation with this request id is not found");
        const txEntity = new TxEntityTemp();
        txEntity.txId = txId;
        txEntity.txSerialized = tx;
        txEntity.creationTime = time;
        txEntity.updateBlock = height;
        txEntity.requestId = requestId;
        txEntity.type = txType;
        txEntity.deleted = false;
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
    removeTx = async (tx: TxEntityTemp) => {
        tx.deleted = true
        return this.txRepository.save(tx)
    }

    /**
     * Updates the tx checking time
     * @param tx
     * @param height
     */
    setTxUpdateHeight = async (tx: TxEntityTemp, height: number) => {
        tx.updateBlock = height
        return this.txRepository.save(tx)
    }

    // /**
    //  * Upgrades the observation TxStatus, it means it had progressed creating transactions
    //  * @param observation
    //  */
    // upgradeObservationTxStatus = async (observation: ObservationEntity) => {
    //     observation.status = observation.status + 1
    //     return this.observationRepository.save(observation)
    // }

    // /**
    //  * Downgrades the observation TxStatus, it means it had problems creating or sending transactions
    //  * @param observation
    //  */
    // downgradeObservationTxStatus = async (observation: ObservationEntity) => {
    //     observation.status = observation.status - 1
    //     return this.observationRepository.save(observation)
    // }

    // /**
    //  * Update the observation TxStatus to the specified new status
    //  * @param observation
    //  * @param status
    //  */
    // updateObservationTxStatus = async (observation: ObservationEntity, status: TxStatus) => {
    //     observation.status = status
    //     return this.observationRepository.save(observation)
    // }
}


export { ergoScannerJob, cardanoScannerJob }
