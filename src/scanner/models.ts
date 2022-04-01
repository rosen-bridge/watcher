import { Observation } from "./utils";
import { DataSource, Entity, Repository } from "typeorm";
import { BlockEntity } from "../models/BlockEntity";
import { Block } from "../objects/apiModels";

class DataBase {
    //TODO: should be added
    // 1- ConnectionManager
    // 2- Error handling throw
    // 3-
    private dataSource: DataSource;
    private blockRepository: Repository<BlockEntity>;

    constructor(dataSource: DataSource) {
        this.dataSource = dataSource;
        this.blockRepository = this.dataSource.getRepository(BlockEntity);
        // console.log(this.blockRepository)
    }

    initDB = () => {
        this.dataSource.initialize()
            .then(() => {
            })
            .catch((error) => console.log(error))
    }

    getBlockHashT = async (blockHeight: number) => {
        const blockHash = await this.blockRepository.findBy({
            height: blockHeight,
        })
        // console.log("block Hash", blockHash);
        return blockHash;
    }

    saveBlock = (height: number, blockHash: String, observations: Array<(Observation | undefined)>): boolean => {
        //TODO:Mocked
        //TODO: input type should be fixed now removing undefined observation are happen in the scanner should be moved here
        return true;
    }

    getBlockAtHeight = (height: number): Promise<Block> => {
        //TODO:Mocked
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve({
                    block_height: 3408015,
                    hash: '45c8ebd2c68b39c4c0fcbebae7cd3b03205edb0d5168062944c079d3a9dd52b2'
                });
            }, 300);
        });
    }

    getLastSavedBlock = (): Promise<Block> => {
        //TODO: this is mocked
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve({
                    block_height: 3408016,
                    hash: '5a1d652747fb39bff5f036f218e668ee6c403cc3ba609cc2d5b0d35f6599fd49'
                });
            }, 300);
        });
    }

    changeLastValidBlock = (height: number) => {
        return true;
    }

    getBlockHash = async (height: number): Promise<string> => {
        //TODO:Mocked
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve('5a1d652747fb39bff5f036f218e668ee6c403cc3ba609cc2d5b0d35f6599fd49');
            }, 300);
        });
    }
}

export default DataBase;

