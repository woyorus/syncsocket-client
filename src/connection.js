const io = require('socket.io-client');
const debug = require('debug')('syncsocket-client:connection');
const bind = require('component-bind');
const Emitter = require('component-emitter');
const Channel = require('./channel');

module.exports = exports = Connection;

Emitter(Connection.prototype);

/**
 * Creates new `Connection` object
 * @param uri URI of SyncSocket server (e.g. http://localhost:5579)
 * @constructor
 * @public
 */
function Connection(uri) {
    this.channels = {};
    let version = require('../package.json').version;
    let opts = {
        query: 'instanceId=' + 'js_cli_' + version,
        'sync disconnect on unload': true,
        path: '/syncsocket'
    };
    this.socket = io.connect(uri, opts);
    this.bindEvents();
}

/**
 * Disconnects from the server
 * @public
 */
Connection.prototype.close = function() {
    this.socket.close();
};

/**
 * Attempt joining a channel with id `channelId`.
 * @param channelId
 * @param canPublish
 * @returns {Promise} Fulfilled promise returns the `Channel` object, rejected — error message.
 * @public
 */
Connection.prototype.joinChannel = function(channelId, canPublish) {
    var channelSpec = {
        canPublish: canPublish,
        channelId: channelId
    };
    return new Promise((resolve, reject) => {
        this.sendRequest('join_channel', channelSpec)
            .then((response) => {
                debug('joined channel: %s', channelId);
                var channel = new Channel(this, channelSpec);
                this.channels[channelId] = channel;
                resolve(channel);
            })
            .catch(function(err) {
                reject('cannot join channel "' + channelId + '". ' + err.message);
            });
    });
};

/**
 * Sends a request to the server.
 * @param what Like a topic
 * @param {object} data
 * @returns {Promise} Resolved with `response`, rejected with error
 * @private
 */
Connection.prototype.sendRequest = function(what, data) {
    return new Promise((resolve, reject) => {
        let reqData = { what: what, body: data };
        this.socket.emit('request', reqData, (err, response) => {
            if (err) {
                return reject(err);
            }
            return resolve(response);
        });
    });
};

Connection.prototype.sendMessage = function(envelope) {
    this.socket.emit('message', envelope);
};

Connection.prototype.bindEvents = function() {
    this.socket.on('connect', bind(this, 'onConnected'));
    this.socket.on('error', bind(this, 'onError'));
    this.socket.on('disconnect', bind(this, 'onDisconnected'));
    this.socket.on('message', bind(this, 'onMessage'));
    this.socket.on('connect_error', bind(this, 'onConnectionError'));
};

/**
 * Distributes received message to its channel object
 * @param envelope
 * @private
 */
Connection.prototype.onMessage = function(envelope) {
    var channel = envelope.channelId;
    debug('received message: \'' + envelope.topic + '\' (ch. -> ' + channel + ')');

    let channelObj = this.channels[channel];

    if (typeof channelObj === 'undefined') {
        debug('received a message for channel that doesn\'t exist! -> %s', channel);
        return;
    }

    channelObj.injectMessage(envelope);
};

Connection.prototype.onConnected = function() {
    debug('connected to server');
    /**
     * Client successfully connected to server
     * @event Connection#connected
     */
    this.emit('connected');
};

Connection.prototype.onError = function(err) {
    debug('Error: ' + err);
    /**
     * Connection error
     * @event Connection#error
     * @type {error} error object
     */
    this.emit('error', err);
};

Connection.prototype.onDisconnected = function() {
    debug('disconnected from server');
    /**
     * Client disconnected from server
     * @event Connection#disconnected
     */
    this.emit('disconnected');
};

Connection.prototype.onConnectionError = function () {
    debug('connection error');
    /**
     * Error while connecting to server
     * @event Connection#connection-error
     */
    this.emit('connection-error');
};
