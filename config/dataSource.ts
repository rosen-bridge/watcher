import path from 'path';
import { DataSource } from "typeorm";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const dataSource = new DataSource({
    type: "sqlite",
    database: __dirname + "/../sqlite/cardanoWatcher.sqlite",
    entities: [
        'src/database/entities/watcher/*.ts',
        'node_modules/@rosen-bridge/scanner/entities/*.js',
        'node_modules/@rosen-bridge/watcher-data-extractor/entities/*.js',
        'node_modules/@rosen-bridge/observation-extractor/entities/*.js',
        'node_modules/@rosen-bridge/address-extractor/dist/entities/*.js'
    ],
    migrations: ['src/database/migrations/watcher/*.ts'],
    synchronize: false,
    logging: false,
});
