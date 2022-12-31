import winston, { format } from 'winston';
import 'winston-daily-rotate-file';
import printf = format.printf;
import { getConfig } from '../config/config';

class Logger {
  logger: winston.Logger;
  private readonly logsPath = getConfig().logger.path;
  private readonly logOptions = {
    datePattern: 'YYYY-MM-DD-HH',
    zippedArchive: true,
    maxSize: getConfig().logger.maxSize,
    maxFiles: getConfig().logger.maxFiles,
  };
  private readonly logFormat = printf(({ level, message, timestamp }) => {
    return `${timestamp} ${level} ${message}`;
  });
  private readonly logLevels = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
  };
  private readonly logLevel = getConfig().logger.level;
  constructor() {
    this.logger = winston.createLogger({
      levels: this.logLevels,
      format: winston.format.combine(
        winston.format.timestamp(),
        this.logFormat
      ),
      transports: [
        new winston.transports.DailyRotateFile({
          filename: this.logsPath + 'rosen-%DATE%.log',
          ...this.logOptions,
          level: this.logLevel,
        }),
        new winston.transports.Console({
          format: winston.format.simple(),
          level: this.logLevel,
        }),
      ],
      handleRejections: true,
      handleExceptions: true,
    });
  }
}

const logger = new Logger().logger;

export { logger };
