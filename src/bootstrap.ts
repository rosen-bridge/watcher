import 'reflect-metadata';
import './shim';
import WinstonLogger from '@rosen-bridge/winston-logger';
import { getConfig } from './config/config';

WinstonLogger.init(getConfig().logger.transports);
