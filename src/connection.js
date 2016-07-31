/**
 *  Module dependencies
 */

const Emitter = require('component-emitter');
const io = require('socket.io-client');
const debug = require('debug')('syncsocket-client:connection');
const bind = require('component-bind');
const Channel = require('./channel');

/**
 *  Exports
 */

module.exports = exports = Connection;

/**
 *  Mix in 'component-emitter'
 */

Emitter(Connection.prototype);

/**
 *
 * @param uri
 * @param opts
 * @constructor
 * @public
 */
function Connection(uri, opts) {
    if (typeof uri == 'object') {
        opts = uri;
        uri = undefined;
    }

    opts = opts || {};
    this.instanceId = opts.instanceId || 'syncsocket-instance';

    this.bound = false;
    this.connected = false;
    this.channels = {};

    opts.query = 'instanceId=' + this.instanceId;
    this.socket = io.connect(uri, opts);
    this.bindEvents();
}


/**
 * Connects to the server (set as connection's `uri` attribute)
 * @returns {Connection}
 * @public
 */
Connection.prototype.connect = function() {
    if (this.connected === true)
        return this;

    this.socket.open();
    return this;
};

/**
 * Disconnects from the server
 * @returns {Connection}
 * @public
 */
Connection.prototype.disconnect = function() {
    if (this.connected === false)
        return this;

    this.socket.close();
    return this;
};

/**
 * Attempt joining a channel with id `channelId`.
 * @param channelId
 * @param opts
 * @returns a promise. Fullfilled promise returns the `Channel` object, rejected — error message.
 * @public
 */
Connection.prototype.join = function(channelId, opts) {
    opts = opts || {
            canPublish: false
        };
    opts.channelId = channelId;
    var that = this;
    return new Promise(function(resolve, reject) {
        that.sendRequest('join_channel', opts)
            .then(function(response) {
                debug('joined channel: %s', channelId);
                var spec = {
                    channelId: channelId,
                    canPublish: opts.canPublish
                };
                var channel = new Channel(that, spec);
                that.channels[channelId] = channel;
                resolve(channel);
            })
            .catch(function(err) {
                reject('cannot join channel "' + channelId + '"');
            });
    });
};

/**
 * Subscribe for inbound messages (sent on server via client.pushMessage)
 * @param topic
 * @param cb
 */
Connection.prototype.subscribe = function(topic, cb) {
    this.socket.on('inbound.' + topic, cb);
};

/**
 *
 * @param what
 * @param data
 * @returns {*|promise}
 * @private
 */
Connection.prototype.sendRequest = function(what, data) {
    var that = this;
    return new Promise(function(resolve, reject) {
        that.socket.emit('request', {
            what: what,
            body: data
        }, function(err, response) {
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

Connection.prototype.onConnected = function() {
    debug('connected to server');
    this.connected = true;
    this.emit('connected');
};

Connection.prototype.onError = function(err) {
    debug('ERROR: ' + err);
    this.emit('error', err);
};

Connection.prototype.onDisconnected = function() {
    debug('disconnected from server');
    this.connected = false;
    this.emit('disconnected');
};

Connection.prototype.onMessage = function(envelope) {
    var channel = envelope.channelId;

    debug('received message: \'' + envelope.topic + '\' (ch. -> ' + channel + ')');
    // Parse the event here.

    // Handle messages on _SYSTEM channel ourselves
    if (channel === '_SYSTEM') {
        this.onSystemMessage(envelope);
        return;
    }

    if (typeof this.channels[channel] !== 'undefined') {
        this.channels[channel].injectMessage(envelope);
    } else {
        debug('received a message for channel that doesn\'t exist! -> %s', channel);
    }
};

/**
 * @private
 */
Connection.prototype.bindEvents = function() {
    if (this.bound) return;

    this.socket.on('connect', bind(this, 'onConnected'));
    this.socket.on('error', bind(this, 'onError'));
    this.socket.on('disconnect', bind(this, 'onDisconnected'));
    this.socket.on('message', bind(this, 'onMessage'));

    this.bound = true;
};

/**
 * Called when a message from _SYSTEM channel is received
 * @param envelope
 * @private
 */
Connection.prototype.onSystemMessage = function(envelope) {
    var topic = envelope.topic;
    debug('received _SYSTEM message: %s', topic);

    switch (topic) {
        case 'disconnect':
            this.disconnect();
            break;
    }
};
