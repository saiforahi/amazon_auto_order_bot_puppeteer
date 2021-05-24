const cron = require('node-cron');
const order=require('./plateform/order');
const schedule = async () => {
    console.log('cron start time-------', new Date());
    cron.schedule('*/15 * * * *', () => {
    console.log("Schedule started.............................................................", new Date());
    // await order(); 
    console.log('Cron stop time-------', new Date());
    });
}
// schedule();
module.exports = schedule;