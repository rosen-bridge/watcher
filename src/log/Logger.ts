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

  constructor() {
    this.logger = winston.createLogger({
      format: winston.format.combine(
        winston.format.timestamp(),
        this.logFormat
      ),
      transports: [
        new winston.transports.DailyRotateFile({
          filename: this.logsPath + 'rosen-%DATE%.log',
          ...this.logOptions,
        }),
      ],

      //Exception logs
      exceptionHandlers: [
        new winston.transports.DailyRotateFile({
          filename: this.logsPath + 'rosen-%DATE%.log',
          ...this.logOptions,
        }),
      ],

      //Rejection logs
      rejectionHandlers: [
        new winston.transports.DailyRotateFile({
          filename: this.logsPath + 'rosen-%DATE%.log',
          ...this.logOptions,
        }),
      ],
    });

    //in case of development environment logs should be written in console
    if (
      process.env.NODE_ENV === 'development' ||
      process.env.NODE_ENV === 'test'
    ) {
      this.logger.add(
        new winston.transports.Console({
          format: winston.format.simple(),
        })
      );
    }
  }
}

const logger = new Logger().logger;

export { logger };
