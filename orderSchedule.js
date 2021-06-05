const cron = require('node-cron');
const amazon=require('./plateform/amazon');
const schedule = async () => {
    console.log('cron start time-------', new Date());
    cron.schedule('*/15 * * * *', () => {
        console.log("Schedule started.............................................................", new Date());
        await Promise.all(amazon)
        //Promise.resolve(amazon()).then(()=>{console.log('Cron stop time-------', new Date());}) 
        console.log('Cron stop time-------', new Date());
    });
}
// schedule();
module.exports = schedule;