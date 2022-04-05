import { main } from "./scanner/scanner";
import "reflect-metadata";
import DataBase from "./scanner/models";
// import watcherData from "./models/DataSource";
import "reflect-metadata";
// const model=require("./models/DataSource");
import { WatcherDataSource } from "../config/watcher-data-source";
// main()

console.log(__dirname)
// WatcherDataSource
//     .initialize()
//     .then(() => {
//         console.log("Data Source has been initialized!")
//     })
//     .catch((err) => {
//         console.error("Error during Data Source initialization:", err)
//     });
// const DB = new DataBase(WatcherDataSource);
// DB.init().then(() => DB.getLastSavedBlock().then(r => console.log(r)))
main()
// DB.initDB()
// DB.getBlockHashT(1).then(r => console.log(r));
// setTimeout(()=>{DB.getLastSavedBlock().then(r => console.log(r));},100);

// DB.changeLastValidBlock(1);
// console.log(DB.getBlockHashT(1))
// DB.saveBlock(1, "sdfs", []).then(r  =>console.log(r));
// const blockRepository = DataSource.getRepository(BlockEntity);
// // console.log(blockRepository)
// const blockHash= blockRepository.find();
// console.log(blockHash)
