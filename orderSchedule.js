const cron = require('node-cron');
const amazon=require('./plateform/amazon');
const schedule = async () => {
    console.log('cron start time-------', new Date());
    cron.schedule('*/15 * * * *', () => {
        console.log("Schedule started.............................................................", new Date());
        amazon(); 
        console.log('Cron stop time-------', new Date());
    });
}
// schedule();
module.exports = schedule;