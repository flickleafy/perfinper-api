import winston from 'winston';
import winstonMongoDB from 'winston-mongodb';
import dotenv from 'dotenv';

dotenv.config();

const { createLogger, transports, format } = winston;
const { combine, timestamp, label, printf } = format;

const myFormat = printf(({ level, message, label, timestamp }) => {
  return `${timestamp} [${label}] ${level}: ${message}`;
});

const logger = createLogger({
  transports: [
    new transports.Console(),
    new transports.MongoDB({
      level: 'info',
      db: process.env.DB_CONNECTION,
      collection: 'logs_transactions',
      capped: true,
      cappedMax: 20,
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      },
    }),
  ],
  format: combine(
    label({ label: 'personalfinance-api' }),
    timestamp(),
    myFormat
  ),
});

export default logger;
