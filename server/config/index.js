const path = require('path');
const url = require('url');
const env = process.env.NODE_ENV || 'local';
const config = require('./local'); // eslint-disable-line import/no-dynamic-require
const db_url = process.env.DB_URL || config.db.uri;
const db_connection_limit = process.env.DB_CONNECTION_LIMIT || config.db.connectionLimit;
const db_connect_timeout = process.env.DB_CONNECT_TIMEOUT || config.db.connectTimeout;
const db_acquire_timeout = process.env.DB_ACQUIRE_TIMEOUT || config.db.acquireTimeout;
const parseConnectionStringURL = (urlString) => {
  let obj = {};
  const urlParts = url.parse(urlString);

  // database name
  if (urlParts.pathname) { obj.database = urlParts.pathname.replace(/^\//, ''); }

  obj.client = urlParts.protocol.endsWith(':') ? urlParts.protocol.substring(0, urlParts.protocol.length - 1) : urlParts.protocol;
  obj.host = urlParts.hostname;

  if (urlParts.port) { obj.port = urlParts.port; }

  if (urlParts.auth) {
    const authParts = urlParts.auth.split(':');

    obj.username = authParts[0];

    if (authParts.length > 1) { obj.password = authParts.slice(1).join(':'); }

  }
  return obj;
};

let db_config = parseConnectionStringURL(db_url);

const defaults = {
  root: path.join(__dirname, '/../../..'),
  env, db_url, db_config, db_connection_limit, db_connect_timeout,
  db_acquire_timeout
};

module.exports = Object.assign(defaults, config);
