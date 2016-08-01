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
    if (!(this instanceof Connection)) return new Connection(uri);
    this.channels = {};
    this.socket = io.connect(uri);
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
                var channel = new Channel(that, channelSpec);
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
    this.socket.on('close', bind(this, 'onDisconnected'));
    this.socket.on('message', bind(this, 'onMessage'));
};

/**
 * Distributes received message to its channel object
 * @param envelope
 * @private
 */
Connection.prototype.onMessage = function(envelope) {
    var channel = envelope.channelId;
    debug('received message: \'' + envelope.topic + '\' (ch. -> ' + channel + ')');

    if (channel === '_SYSTEM')
    {
        this.onSystemMessage(envelope);
        return;
    }

    if (typeof this.channels[channel] === 'undefined')
    {
        debug('received a message for channel that doesn\'t exist! -> %s', channel);
    }

    this.channels[channel].injectMessage(envelope);
};

Connection.prototype.onConnected = function() {
    debug('connected to server');
    this.emit('connected');
};

Connection.prototype.onError = function(err) {
    debug('ERROR: ' + err);
    this.emit('error', err);
};

Connection.prototype.onDisconnected = function() {
    debug('disconnected from server');
    this.emit('disconnected');
};

/**
 * Received a message on _SYSTEM channel
 * @param envelope
 * @private
 */
Connection.prototype.onSystemMessage = function(envelope) {
    let topic = envelope.topic;
    debug('received _SYSTEM message: %s', topic);

    switch (topic)
    {
        case 'close':
            this.close();
            break;
    }
};
