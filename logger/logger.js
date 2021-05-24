const { transports, format, createLogger } = require('winston');
const winston = require('winston');
require('winston-daily-rotate-file');
const { combine, timestamp, label, prettyPrint } = format;
const path = require('path');
const transport = new (winston.transports.DailyRotateFile)({
    filename: path.join(__dirname, "..", `logfiles/application-%DATE%.log`),
    datePattern: 'YYYY-MM-DD-HH',
    zipAechive: true,
    maxSize: '20m',
    maxFiles: '7d'
});
transport.on('rotate', function (oldFilename, newFilename) {
    let date = new Date();
    console.log('logger-----',date);
})


const logger = createLogger({
    format: combine(
        timestamp(),
        prettyPrint()
    ),
    exitOnError: false,
    transports: [
        transport
    ]
});
module.exports = logger;