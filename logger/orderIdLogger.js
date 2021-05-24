const { transports, format, createLogger } = require('winston');
const winston = require('winston');
require('winston-daily-rotate-file');
const { combine, timestamp, label, prettyPrint } = format;
const path = require('path');
const transport = new (winston.transports.DailyRotateFile)({
    filename: path.join(__dirname, "..", `orderIdLogs/application-%DATE%.log`),
    datePattern: 'YYYY-MM-DD',
    zipAechive: true,
    maxSize: '40m',
});

const orderIdlogger = createLogger({
    format: combine(
        timestamp(),
        prettyPrint()
    ),
    exitOnError: false,
    transports: [
        transport
    ]
});
module.exports = orderIdlogger;