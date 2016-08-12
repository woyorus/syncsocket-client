const expect = require('chai').expect;
const connect = require('../src/index');

const TEST_CHANNEL_ID = 'testChannel';
const TEST_SERVER_URL = 'http://localhost:6066';

describe('syncsocket-client', function () {
    this.timeout(30000);

    describe('connect', function () {
        it('should connect to the server', function (done) {
            var conn = connect(TEST_SERVER_URL);
            conn.on('connected', () => {
                conn.close();
                done();
            });
        });

        it('should not connect to server which doesn\'t exist', function (done) {
            var conn = connect('http://dfaesf234rfgy234f23f23f.ca');
            conn.once('connection-error', () => {
                done();
            });
        });
    });
});

describe('Connection', function () {
    var conn;

    beforeEach(function (done) {
        conn = connect(TEST_SERVER_URL);
        conn.on('connected', () => {
            done();
        });
    });

    afterEach(function (done) {
        conn.close();
        done();
    });

    describe('close', function () {
        it('should disconnect from the server', function (done) {
            conn.on('disconnected', () => done());
            conn.close();
        });
    });

    describe('joinChannel', function () {
        it('should join an existing channel', function (done) {
            conn.joinChannel(TEST_CHANNEL_ID, false).then(channel => {
                expect(channel).to.be.an('object');
                expect(channel.channelId).to.be.equal(TEST_CHANNEL_ID);
                conn.close();
                done();
            }).catch(err => done(err));
        });

        it('should not join a non-existing channel', function (done) {
            conn.joinChannel('fakeChannel', false).then(channel => {
                done(new Error('joined a channel that should not exist'));
            }).catch(_ => {
                // error case, test passed.
                done();
            });
        });
    });
});

describe('Channel', function () {
    this.timeout(30000);

    var conn;

    beforeEach(function (done) {
        conn = connect(TEST_SERVER_URL);
        conn.on('connected', () => {
            done();
        });
    });

    afterEach(function (done) {
        conn.close();
        done();
    });

    it('should be created in uninitialized state', function (done) {
        conn.joinChannel(TEST_CHANNEL_ID, false).then(ch => {
            expect(ch.currentState).to.be.eql('uninitialized');
            conn.close();
            done();
        }).catch(err => done(err));
    });

    it('should begin synchronization once created', function (done) {
        conn.joinChannel(TEST_CHANNEL_ID, false).then(ch => {
            expect(ch.currentState).to.not.be.eql('idle');
            ch.on('syncSuccessful', syncResult => {
                expect(ch.currentState).to.be.eql('idle');
                expect(syncResult).to.be.an('object');
                expect(syncResult.successful).to.be.true;
                expect(syncResult.error).to.be.a('number');
                expect(syncResult.adjust).to.be.a('number');
                conn.close();
                done();
            });
        }).catch(err => done(err));
    });

    it('should receive messages from self', function (done) {
        conn.joinChannel(TEST_CHANNEL_ID, true).then(ch => {
            ch.on('syncSuccessful', syncResult => {
                ch.subscribe('testTopic',
                    () => {
                    },
                    () => {
                        conn.close();
                        done();
                    });
                ch.publish('testTopic');
            });
        }).catch(err => done(err));
    });

    it('should receive prepare call and then fire call', function (done) {
        conn.joinChannel(TEST_CHANNEL_ID, true).then(ch => {
            ch.on('syncSuccessful', syncResult => {
                var prepareReceived = false;
                ch.subscribe('testTopic',
                    () => {
                        prepareReceived = true;
                    },
                    () => {
                        expect(prepareReceived).to.be.true;
                        conn.close();
                        done();
                    });
                ch.publish('testTopic');
            });
        }).catch(err => done(err));
    });

    it('should not allow publishing without privileges', function (done) {
        conn.joinChannel(TEST_CHANNEL_ID, false).then(ch => {
            ch.on('syncSuccessful', syncResult => {
                ch.on('error', err => {
                    expect(err).not.to.be.null;
                    done();
                });
                ch.publish('testTopic');
            });
        });
    });

    it('should receive any messages once subscribed to hash', function (done) {
        conn.joinChannel(TEST_CHANNEL_ID, true).then(ch => {
            ch.on('syncSuccessful', syncResult => {
                ch.subscribe('#', () => {}, () => { done(); });
                ch.publish('weirdtopic12321d');
            });
        });
    });
});
