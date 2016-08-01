
/**
 * Module dependencies
 */

const Connection = require('./connection');

/**
 * Module exports
 */

module.exports = exports = connect;


/**
 * Attempts connection to a together server.
 * Opts doesn't do anything now, it is here for the future.
 *
 * @returns a `Connection` object.
 *
 * @api public
 */

function connect(uri, opts) {
    return new Connection(uri, opts);
}

exports.connect = connect;

