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
server.createChannel({ channelId: env.testChannelId });
server.listen(env.port);

describe('connection', function () {
    this.timeout(30000);

    var connection;

    beforeEach(function (done) {
        connection = connect(env.url);
        connection.on('connected', () => done());
    });

    afterEach(function (done) {
        connection.on('disconnected', () => done());
        connection.close();
    });


    it('should join channel', function (done) {
        var connection = connect(env.url);
        connection.on('connected', function () {
            connection.join(env.testChannelId)
                .then(channel => {
                    expect(channel).to.be.an('object');
                    done();
                })
                .catch(err => done(err));
        });
    });

    it('should post and receive a message', function (done) {
        var connection = connect(env.url);
        connection.on('connected', () => {
            connection.join(env.testChannelId, { canPublish: true })
                .then(channel => {
                    channel.on('syncSuccessful', () => {
                        let prepareWasCalled = false;
                        channel.subscribe('testTopic',
                            () => {
                                console.log('prepare');
                                prepareWasCalled = true;
                                channel.finalizeTransition();
                            },
                            () => {
                                console.log('fire');
                                expect(prepareWasCalled).to.be.true;
                                done();
                            });
                        setTimeout(() => channel.publish('testTopic'), 500);
                    });
                });
        });
    });
});
