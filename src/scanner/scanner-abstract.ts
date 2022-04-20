import { DatabaseAbstract } from "./database-abstract";
import { Block } from "../objects/apiModels";
import { Observation } from "./utils";

abstract class ScannerAbstract {
    private _dataBase: DatabaseAbstract;

    protected constructor(db: DatabaseAbstract) {
        this._dataBase = db;
    }

    abstract async isForkHappen(): Promise<Boolean>;

    abstract async getBlockAndObservations(height: number): Promise<[Block, Array<Observation | undefined>]>;

    abstract async update(): Promise<void>;

}
