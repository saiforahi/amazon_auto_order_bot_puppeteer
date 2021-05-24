const mysql = require('mysql');
const config = require('../config/index');
const pool = mysql.createPool(`${config.db_url}?connectionLimit=${config.db_connection_limit}
&dateStrings=true&multipleStatements=true
&acquireTimeout=${config.db_acquire_timeout}
&connectTimeout=${config.db_connect_timeout}`);
class DB {
  static getConnection() {
    return new Promise((resolve, reject) => {
      pool.getConnection((err, connection) => {
        console.log('database connected');
        if (err) { console.log('err--------', err); return reject(err); }
        return resolve(connection);
      });
    });
  }
  static releaseConnection(connection) {
    if (connection) {
      if (!DB.isReleased(connection)) {
        console.log("database released")
        connection.release();
      }
    }
  }
  static isReleased(connection) {
    return pool._freeConnections.indexOf(connection) !== -1;
  }

  static commitTransaction(connection) {
    return new Promise((resolve, reject) => {
      connection.commit((err) => {
        if (err) { return reject(err); }

        if (!DB.isReleased(connection)) { connection.release(); }
        return resolve();
      });
    });
  }
  static rollbackTransaction(connection) {
    return new Promise((resolve, reject) => {
      connection.rollback((err) => {
        if (!DB.isReleased(connection)) { connection.release(); }

        if (err) { return reject(err); }
        return resolve();
      });
    });
  }
  static beginTransaction(connection) {
    return new Promise((resolve, reject) => {
      try {
        connection.beginTransaction(err => {
          if (err) { throw err; }

          return resolve();
        });
      }
      catch (error) {
        if (!DB.isReleased(connection)) { connection.release(); }
        console.log(error);
        return reject(error);
      }
    });
  }


}
module.exports = DB;
