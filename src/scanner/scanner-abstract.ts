import { modelAbstract } from "./model-abstract";
import { Block } from "../objects/apiModelsCardano";
import { Observation } from "./utils";

export abstract class ScannerAbstract {
    abstract _dataBase: modelAbstract;

    abstract isForkHappen(): Promise<Boolean>;

    abstract getBlockAndObservations(height: number): Promise<[Block, Array<Observation | undefined>]>;

    abstract update(): Promise<void>;

}
