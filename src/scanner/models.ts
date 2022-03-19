import { Observation } from "./utils";
import { Block } from "../models/apiModels";

export const saveObservation = (observations: (Observation | undefined)[]):boolean => {
    //TODO:Mocked
    return true;
}

export const getBlockAtHeight =(height:number):Promise<Block>=>{
    //TODO:Mocked
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve({block_height: 3408015, hash: '45c8ebd2c68b39c4c0fcbebae7cd3b03205edb0d5168062944c079d3a9dd52b2'});
        }, 300);
    });

}

export const getLastSavedBlock = (): Promise<Block> => {
    //TODO: this is mocked
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve({block_height: 3408016, hash: '5a1d652747fb39bff5f036f218e668ee6c403cc3ba609cc2d5b0d35f6599fd49'});
        }, 300);
    });
}

export const getBlockHash = async (height: number): Promise<string> => {
    //TODO:Mocked
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve('5a1d652747fb39bff5f036f218e668ee6c403cc3ba609cc2d5b0d35f6599fd49');
        }, 300);
    });
}

