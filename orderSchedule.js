const cron = require('node-cron');
const amazon=require('./plateform/amazon');
const schedule =  () => {
    console.log('cron start time-------', new Date());
    cron.schedule('*/15 * * * *', async () => {
        console.log("Schedule started.............................................................", new Date());
        Promise.all(amazon()).then(()=>{console.log('Cron stop time-------', new Date());})
        //Promise.resolve(amazon()).then(()=>{console.log('Cron stop time-------', new Date());}) 
        // console.log('Cron stop time-------', new Date());
    });
}
// schedule();
module.exports = schedule;