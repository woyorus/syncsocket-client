const Emitter = require('component-emitter');
const ObjectFsm = require('object-fsm');
const ClockClient = require('syncsocket-clock-client');
const debug = require('debug')('syncsocket-client:channel');
const bind = require('component-bind');

module.exports = exports = Channel;

Emitter(Channel.prototype);

/**
 * Channel constructor
 * @param connection
 * @param {Object} spec Connection options
 * @param {string} spec.channelId The channel identifier
 * @param {Boolean} spec.isPublisher Flag whether or not user can publish to this channel
 * @constructor
 * @public
 */
function Channel(connection, spec) {
    if (!(this instanceof Channel)) return new Channel(connection, spec);

    this.connection = connection;
    this.channelId = spec.channelId;
    this.canPublish = spec.canPublish;
    this.subscribedTopics = [];
    this.fireCallbacks = {};
    this.prepareCallbacks = {};

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
    this.initStates();
    this.initEvents();
    this.setStartingState('uninitialized');

    // Report every successful transition back to server
    this.on('didTransition', function (fromState, toState) {
        this.reportTransition(toState);
        /**
         * Channel switched state
         * @event Channel#transition
         * @type {object}
         * @property {string} from State transition was from
         * @property {string} to State transitioned to
         */
        this.emit('transition', { from: fromState, to: toState });
    });
};

Channel.prototype.initStates = function () {
    this.addStates(
        ['uninitialized',
        'unsynchronized',
        'idle',
        'ready',
        'scheduled']
    );
};

Channel.prototype.initEvents = function () {
    this.addEvent('initialize', 'uninitialized', 'unsynchronized', bind(this, 'onInitialize'));
    this.addEvent('synchronize', ['unsynchronized', 'idle', 'ready', 'scheduled'], 'idle', bind(this, 'onSynchronize'));
    this.addEvent('cancel', ['ready', 'scheduled'], 'idle');
    this.addEvent('prepare', 'idle', 'ready', bind(this, 'onPrepare'));
    this.addEvent('schedule', 'ready', 'scheduled', bind(this, 'onSchedule'));
    this.addEvent('finalize', 'scheduled', 'idle');
};

/**
 * Notifies server about state change
 * @param toState
 * @private
 */
Channel.prototype.reportTransition = function (toState) {
    this.channelDebug(' > Reporting transition to state -> ' + toState);
    this.publishService('reportstate', {toState: toState});
};

/**
 * Subscribes for messages on given `topic`.
 * Subscribing to topic `#` will make you subscribe to any message in the channel.
 * @param {string} topic
 * @param {function(*):*} prepareCallback The callback called during prepare transition
 * @param {function(*):*} fireCallback The callback called during the 'fire' event
 * @public
 */
Channel.prototype.subscribe = function (topic, prepareCallback, fireCallback) {
    this.subscribedTopics.push(topic);
    this.prepareCallbacks[topic] = prepareCallback;
    this.fireCallbacks[topic] = fireCallback;
};

/**
 * Publishes a user message to the channel
 * @param {string} topic
 * @param {object} data
 * @fires Channel#error
 * @public
 */
Channel.prototype.publish = function (topic, data) {
    this.channelDebug('publishing message: { topic: ' + topic + ', data: ' + data + ' }');

    if (this.canPublish === false) {
        var reason = 'insufficient privileges for publishing messages (channel: ' + this.channelId + ')';
        this.channelDebug(reason);
        /**
         * Error in channel
         * @event Channel#error
         * @type {string}
         */
        this.emit('error', reason);
        return;
    }

    var envelope = {
        channelId: this.channelId,
        topic: 'user.' + topic,
        data: data
    };

    this.connection.sendMessage(envelope);
};

/**
 * Publishes a service message to the channel
 * @param topic
 * @param data
 * @returns {Channel}
 * @private
 */
Channel.prototype.publishService = function (topic, data) {
    debug('publishing -service- message: { topic: ' + topic + ', data: ' + data + ' }');

    var envelope = {
        channelId: this.channelId,
        topic: 'service.' + topic,
        data: data
    };

    this.connection.sendMessage(envelope);
    return this;
};

/**
 * Injects message into the channel. Distributes it either to `processUserMessage` or to `processServiceMessage`
 * @param envelope
 * @private
 */
Channel.prototype.injectMessage = function (envelope) {
    var topicParts = envelope.topic.split('.');
    switch (topicParts[0]) {
        case 'user':
            // Check if we have this subscription
            if (this.subscribedTopics.indexOf(topicParts[1]) !== -1 ||
                this.subscribedTopics.indexOf('#') !== -1) {
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
    this.channelDebug('processing user message: ' + userTopic + ', transition: ' + transition);

    switch (transition) {

        case 'prepare':
            this.handleEvent('prepare', envelope);
            break;

        case 'schedule':
            this.handleEvent('schedule', envelope);
            break;

        default:
            this.channelDebug('invalid transition -> %s', transition);

    }
};

/**
 * Server switches states on clients using this.
 * @param envelope
 * @private
 */
Channel.prototype.processServiceMessage = function (envelope) {
    var data = envelope.data;
    var topicParts = envelope.topic.split('.');

    switch (topicParts[1]) {
        case 'initialize':
            this.handleEvent('initialize', data);
            this.handleEvent('synchronize');
            break;

        default:
            this.channelDebug('unrecognized service message caught: %s', topicParts[1]);
            break;
    }
};

Channel.prototype.onInitialize = function (spec) {
    if (typeof spec.timeserver === 'undefined') {
        console.error('Initialized with undefined timeserver');
    }
    this.timeserver = spec.timeserver;
    this.channelDebug('Initializing with timeserver \'' + this.timeserver + '\'');
    this.clockClient = new ClockClient(this.timeserver);
};

Channel.prototype.onSynchronize = function () {
    this.channelDebug('Synchronizing with timeserver \'' + this.timeserver + '\'...');
    this.deferTransition();
    this.clockClient.sync()
        .then(result => {
            if (result.successful === true) {
                this.channelDebug('sync successful!');
                this.lastSyncResult = result;
                this.finalizeTransition();
                /**
                 * Synchronization with timeserver succeeded
                 * @event Channel#syncSuccessful
                 * @type {object}
                 * @property {number} error - Reading's max variation from truth (ms)
                 * @property {number} adjust - Difference between local and remote clocks (ms)
                 */
                this.emit('syncSuccessful', result);
            } else {
                this.channelDebug('sync failed!');
                /**
                 * Synchronization with timeserver failed
                 * @event Channel#syncFailed
                 * @type {object}
                 * @property {number} error - Reading's max variation from truth (ms)
                 * @property {number} adjust - Difference between local and remote clocks (ms)
                 */
                this.emit('syncFailed', result);
            }
        })
        .catch(err => console.error(err));
};

Channel.prototype.onPrepare = function (envelope) {
    var topicParts = envelope.topic.split('.');
    var userTopic = topicParts[1];
    var callback = this.prepareCallbacks[userTopic];
    callback.call(this, envelope.data);
};

Channel.prototype.onSchedule = function (envelope) {
    var topicParts = envelope.topic.split('.');
    var userTopic = topicParts[1];
    var callback = this.fireCallbacks[userTopic];
    var timeticket = envelope.headers['x-cct-timeticket'];
    var fireIn = (timeticket - this.lastSyncResult.adjust) - Date.now();
    setTimeout(() => {
        callback(envelope.data);
        this.handleEvent('finalize');
    }, fireIn);
    this.channelDebug('scheduled event: ' + userTopic + ' in ' + fireIn + ' ms');
};

Channel.prototype.channelDebug = function (msg) {
    debug('[%s][%s] %s', this.channelId, this.currentState, msg);
};
