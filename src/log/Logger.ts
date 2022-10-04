import winston, { format } from 'winston';
import 'winston-daily-rotate-file';
import { Config } from '../config/config';
import printf = format.printf;

class Logger {
  logger: winston.Logger;
  private readonly logsPath = Config.getConfig().logPath;
  private readonly logOptions = {
    datePattern: 'YYYY-MM-DD-HH',
    zippedArchive: true,
    maxSize: Config.getConfig().logMaxSize,
    maxFiles: Config.getConfig().logMaxFiles,
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
  private readonly logLevel = Config.getConfig().logLevel;
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
