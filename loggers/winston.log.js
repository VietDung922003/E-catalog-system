'use strict';

const winston = require('winston');
require('winston-daily-rotate-file');

const logFormat = winston.format.printf(({ level, message, timestamp }) => {
 return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
});

const logger = winston.createLogger({
 level: 'error',
 format: winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  logFormat
 ),
 transports: [
  new winston.transports.Console(),
  new winston.transports.File({
   dirname:'logs', filename: 'test.log', level: 'error'
  }),
  new winston.transports.DailyRotateFile({
   dirname: 'logs',
   filename: 'app-%DATE%.log',
   datePattern: 'YYYY-MM-DD',
   maxSize: '20m',
   maxFiles: '14d'
  })
 ]
})

module.exports = logger;