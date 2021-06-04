const amazon = require('./plateform/amazon');
const schedule = require('./orderSchedule')
const scrapper = async () => {
    schedule();
}
module.exports = scrapper;