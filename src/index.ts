import { main } from "./scanner/scanner";
import "reflect-metadata";
import DataBase from "./scanner/models";
// import watcherData from "./models/WatcherDataSource";
import "reflect-metadata";
// const model=require("./models/WatcherDataSource");
import { BlockEntity } from "./entity/BlockEntity";
import { WatcherDataSource } from "./models/WatcherDataSource";
// main()

console.log(__dirname)
const DB=new DataBase(WatcherDataSource);
// DB.initDB()
// DB.getBlockHashT(1).then(r => console.log(r));
// DB.getLastSavedBlock().then(r => console.log(r));
// DB.changeLastValidBlock(1);
// console.log(DB.getBlockHashT(1))
DB.saveBlock(1, "sdfs", []).then(r  =>console.log(r));
// const blockRepository = WatcherDataSource.getRepository(BlockEntity);
// // console.log(blockRepository)
// const blockHash= blockRepository.find();
// console.log(blockHash)
