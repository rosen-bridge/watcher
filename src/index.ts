import { main } from "./scanner/scanner";
import "reflect-metadata";
import DataBase from "./scanner/models";
import { WatcherDataSource } from "./models/WatcherDataSource";
import "reflect-metadata";
// main()

console.log(__dirname)
const DB=new DataBase(WatcherDataSource);
DB.initDB()
console.log(DB.getBlockHashT(1))
