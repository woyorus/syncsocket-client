const Emitter = require('component-emitter');
const ObjectFsm = require('object-fsm');
const ClockClient = require('syncsocket-clock-client');
const inherits = require('inherits');
const debug = require('debug')('syncsocket-client:channel');
const bind = require('component-bind');

module.exports = exports = Channel;

Emitter(Channel.prototype);


/**
 * Channel constructor
 * @param connection
 * @param {Object} opts Connection options
 * @param {string} opts.channelId The channel identifier
 * @param {Boolean} opts.isPublisher Flag whether or not user can publish to this channel
 * @constructor
 * @public
 */
function Channel(connection, opts) {
    if (!(this instanceof Channel)) return new Channel(connection, opts);

    this.connection = connection;
    this.channelId = opts.channelId;
    this.isPublisher = opts.canPublish;
    this.subscribedTopics = [];
    this.topicCallbacks = {};
    this.topicPrepareCallbacks = {};


    ObjectFsm(this);
    this.initStateMachine();

    /* Hackery */
    this.reportTransition('uninitialized');
}

/**
 * Initializes the channel's state machine
 * @private
 */
Channel.prototype.initStateMachine = function () {
    this.addState(
        'uninitialized',
        'unsynchronized',
        'idle',
        'ready',
        'scheduled'
    );

    this.addEvent('initialize', 'uninitialized', 'unsynchronized', (spec) => this.onInitialize(spec));
    this.addEvent('synchronize', ['unsynchronized', 'idle', 'ready', 'scheduled'], 'idle', () => this.onSynchronize());
    this.addEvent('cancel', ['ready', 'scheduled'], 'idle');
    this.addEvent('prepare', 'idle', 'ready', (env) => this.onPrepare(env));
    this.addEvent('schedule', 'ready', 'scheduled', (env) => this.onSchedule(env));
    this.addEvent('finalize', 'scheduled', 'idle');

    this.setStartingState('uninitialized');

    // Report every successful transition back to server
    this.on('didTransition', function (fromState, toState, event) {
        this.reportTransition(toState);
        this.emit('transition', fromState, toState);
    });
};

/**
 *
 * @param toState
 * @private
 */
Channel.prototype.reportTransition = function (toState) {
    debug(' > [%s] Reporting transition to state -> %s', this.channelId, toState);
    this.publishService('reportstate', {toState: toState});
};


/**
 * Subscribes for messages on given `topic`.
 * Subscribing to topic `#` will make you subscribe to any message in the channel.
 * @param topic
 * @param callbackPrepare -- The callback called during prepare transition
 * @param callbackFire -- The callback called during the 'fire' event
 * @returns {Channel}
 * @public
 */
Channel.prototype.subscribe = function (topic, callbackPrepare, callbackFire) {
    this.subscribedTopics.push(topic);
    this.topicPrepareCallbacks[topic] = callbackPrepare;
    this.topicCallbacks[topic] = callbackFire;
    return this;
};

/**
 * Publishes a message to the channel
 * @param topic
 * @param data
 * @returns {Channel}
 * @public
 */
Channel.prototype.publish = function (topic, data) {
    debug('publishing message: { topic: ' + topic + ', data: ' + data + ' }');

    if (this.isPublisher === false) {
        var reason = 'insufficient privileges for publishing messages (channel: ' + this.channelId + ')';
        debug(reason);
        this.emit('error', reason);
        return this;
    }

    var envelope =
    {
        channelId: this.channelId,
        topic: 'user.' + topic,
        data: data
    };

    this.connection.sendMessage(envelope);
    return this;
};

/**
 * Force synchronize clockClient
 * @return {[type]} [description]
 * @private
 */
Channel.prototype.synchronize = function () {
    this.handleEvent('synchronize');
};

/**
 *
 * @param topic
 * @param data
 * @returns {Channel}
 * @private
 */
Channel.prototype.publishService = function (topic, data) {
    //debug('publishing sys message: { topic: ' + topic + ', data: ' + data + ' }');

    var envelope =
    {
        channelId: this.channelId,
        topic: 'service.' + topic,
        data: data
    };

    this.connection.sendMessage(envelope);
    return this;
};

/**
 *
 * @param envelope
 * @private
 */
Channel.prototype.injectMessage = function (envelope) {
    var topic = envelope.topic;

    var topicParts = topic.split('.');

    switch (topicParts[0]) {

        case 'user':
            // Check if we have this subscription
            if (this.subscribedTopics.indexOf(topicParts[1]) != -1 ||
                this.subscribedTopics.indexOf('#') != -1) {
                this.processUserMessage(envelope);
            }
            break;

        case 'service':
            this.processServiceMessage(envelope);
            break;

    }
};

/**
 *
 * @param envelope
 * @private
 */
Channel.prototype.processUserMessage = function (envelope) {
    var topicParts = envelope.topic.split('.');
    var userTopic = topicParts[1];
    var transition = topicParts[2];
    this.chdebug('processing user message: ' + userTopic + ', transition: ' + transition);

    switch (transition) {

        case 'prepare':
            this.handleEvent('prepare', envelope);
            break;

        case 'schedule':
            this.handleEvent('schedule', envelope);
            break;

        default:
            debug('invalid transition -> %s', transition);

    }
};

/**
 *
 * @param envelope
 * @private
 */
Channel.prototype.processServiceMessage = function (envelope) {
    var topic = envelope.topic;
    var data = envelope.data;

    var topicParts = topic.split('.');

    switch (topicParts[1]) {

        case 'initialize':
            this.handleEvent('initialize', data);
            break;

        case 'synchronize':
            this.handleEvent('synchronize');
            break;

        case 'initialState':
            this.emit('initialState', data);
            break;

        default:
            debug('unrecognized service message caught: %s', topicParts[1]);
            break;

    }
};

/**
 * To 'initialized' state transition handler
 * @private
 */
Channel.prototype.onInitialize = function (spec) {
    if (typeof spec.timeserver === 'undefined') throw 'Initialized with undefined timeserver';
    this.timeserver = spec.timeserver;
    this.chdebug('Initializing with timeserver \'' + this.timeserver + '\'');

    this.clockClient = new ClockClient(this.timeserver);
};

/**
 * To 'synchronized' state transition handler
 * @private
 */
Channel.prototype.onSynchronize = function () {
    var that = this;
    this.chdebug('Synchronizing with timeserver \'' + this.timeserver + '\'...');
    this.deferTransition();

    this.clockClient.sync()
        .then(result => {
            if (result.successful === true) {
                debug('sync successful!');
                this.emit('syncSuccessful', result.precision, result.adjust);
                this.lastSyncResult = result;
                this.finalizeTransition();
            } else {
                debug('sync failed!');
                this.emit('syncFailed', result.precision);
            }
        })
        .catch(err => console.error(err));
};

/**
 * To 'prepared' state transition handler
 * @private
 */
Channel.prototype.onPrepare = function (envelope) {
    var topicParts = envelope.topic.split('.');
    var userTopic = topicParts[1];
    var callback = this.topicPrepareCallbacks[userTopic];
    callback(envelope.data, envelope);
};


/**
 * To 'scheduled' state transition handler
 * @private
 */
Channel.prototype.onSchedule = function (envelope) {
    var that = this;
    var topicParts = envelope.topic.split('.');
    var userTopic = topicParts[1];
    var callback = this.topicCallbacks[userTopic];
    var timeticket = envelope.headers['x-cct-timeticket'];
    var fireIn = (timeticket - this.lastSyncResult.adjust) - Date.now();
    this.chdebug('scheduling event: ' + userTopic + ' in ' + fireIn + ' ms');
    setTimeout(function () {
        callback(envelope.data, envelope);
        that.handleEvent('finalize');
    }, fireIn);
};

/**
 * @private
 */
Channel.prototype.chdebug = function (msg) {
    debug('[%s][%s] %s', this.channelId, this.state, msg);
};
