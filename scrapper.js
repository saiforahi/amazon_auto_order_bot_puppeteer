const amazon = require('./plateform/amazon');
//const schedule = require('./orderSchedule')
const scrapper = async () => {
    amazon();
}
module.exports = scrapper;