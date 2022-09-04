import path from 'path';
import { DataSource } from "typeorm";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// TODO: datasource config
//  fix entities directories
//  fix migrations (use package migrations)
export const dataSource = new DataSource({
    type: "sqlite",
    database: __dirname + "/../sqlite/watcher.sqlite",
    entities: [
        'src/database/entities/*.ts',
        'node_modules/@rosen-bridge/scanner/dist/entities/*.js',
        'node_modules/@rosen-bridge/watcher-data-extractor/dist/entities/*.js',
        'node_modules/@rosen-bridge/observation-extractor/dist/entities/*.js',
        'node_modules/@rosen-bridge/address-extractor/dist/entities/*.js'
    ],
    migrations: ['src/database/migrations/watcher/*.ts'],
    synchronize: false,
    logging: false,
});
