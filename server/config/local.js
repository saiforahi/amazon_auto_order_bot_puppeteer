module.exports = {
    env: 'local',
    port: 8000,

    db: {
        // "uri": "mysql://root:root123@localhost:3306/amazon",  //local
        "uri": "mysql://u326616021_admin:Spring@123@31.170.167.140:3306/u326616021_walmart",  //vultr  cpanel db


        "connectionLimit": 10,
        "acquireTimeout": 100000,
        "connectTimeout": 100000
    }
}