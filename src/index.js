const Connection = require('./connection');

module.exports = exports = connect;

/**
 * Attempts connection to a SyncSocket server.
 * @param {string} uri Server URI
 * @returns {Connection} `Connection` object.
 * @public
 */
function connect(uri) {
    return new Connection(uri);
}

exports.connect = connect;

