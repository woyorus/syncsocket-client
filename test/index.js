const expect = require('chai').expect;
const connect = require('../src/index');
const Server = require('syncsocket');

const env = {
    url: 'http://localhost:6066',
    host: 'localhost',
    port: 6066,
    timeserverHost: 'localhost',
    timeserverPort: 5579,
    testChannelId: 'test-channel'
};

var server = new Server();
server.createChannel({channelId: env.testChannelId});
server.listen(env.port);

describe('syncsocket-client', function () {
    this.timeout(30000);

    describe('connect', function () {
        it('should connect to the server', function (done) {
            var conn = connect(env.url);
            conn.on('connected', () => {
                conn.close();
                done();
            });
        });

        it('should not connect to server which doesn\'t exist', function (done) {
            var conn = connect('http://dfaesf234rfgy234f23f23f.ca');
            conn.on('connection-error', () => done());
        });
    });

});

describe('Connection', function () {
    var conn;

    beforeEach(function (done) {
        conn = connect(env.url);
        conn.on('connected', () => {
            done();
        })
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

    it('should not connect to server which doesn\'t exist', function (done) {
        var conn = connect('http://dfaesf234rfgy234f23f23f.ca');
        conn.on('connection-error', () => done());
    });

    describe('joinChannel', function () {
        it('should join an existing channel', function (done) {
            conn.joinChannel(env.testChannelId, false).then(channel => {
                expect(channel).to.be.an('object');
                expect(channel.channelId).to.be.equal(env.testChannelId);
                conn.close();
                done();
            }).catch(err => done(err));
        });

        it('should not join a non-existing channel', function (done) {
            conn.joinChannel('fakeChannel', false).then(channel => {
                done(new Error('joined a channel that should not exist'));
            }).catch(err => {
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
        conn = connect(env.url);
        conn.on('connected', () => {
            done();
        })
    });

    afterEach(function (done) {
        conn.close();
        done();
    });

    it('should be created in uninitialized state', function (done) {
        conn.joinChannel(env.testChannelId, false).then(ch => {
            expect(ch.currentState).to.be.eql('uninitialized');
            conn.close();
            done();
        }).catch(err => done(err));
    });

    it('should begin synchronization once created', function (done) {
        conn.joinChannel(env.testChannelId, false).then(ch => {
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
        conn.joinChannel(env.testChannelId, true).then(ch => {
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
        conn.joinChannel(env.testChannelId, true).then(ch => {
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

});
