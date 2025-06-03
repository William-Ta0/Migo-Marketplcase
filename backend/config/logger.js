const winston = require('winston');
const path = require('path');

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
);

const logger = winston.createLogger({
  level: 'info', // Log 'info' and above (info, warn, error)
  format: logFormat,
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        logFormat
      )
    }),
    new winston.transports.File({
      filename: path.join(__dirname, '..', 'logs', 'app.log'), // Log to backend/logs/app.log
      level: 'info' // Log 'info' and above to this file
    }),
    new winston.transports.File({
      filename: path.join(__dirname, '..', 'logs', 'error.log'),
      level: 'error' // Log only 'error' level to this file
    })
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: path.join(__dirname, '..', 'logs', 'exceptions.log') })
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: path.join(__dirname, '..', 'logs', 'rejections.log') })
  ]
});

module.exports = logger;
