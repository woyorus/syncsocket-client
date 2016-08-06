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

    it('should connect to the server', function (done) {
        var conn = connect(env.url);
        conn.on('connected', () => {
            conn.close();
            done();
        });
    });

    it('should disconnect from the server', function (done) {
        var conn = connect(env.url);
        conn.on('connected', () => {
            conn.on('disconnected', () => done());
            conn.close();
        });
    });

    it('should join an existing channel', function (done) {
        var conn = connect(env.url);
        conn.on('connected', () => {
            conn.joinChannel(env.testChannelId, false).then(channel => {
                expect(channel).to.be.an('object');
                expect(channel.channelId).to.be.equal(env.testChannelId);
                conn.close();
                done();
            }).catch(err => done(err));
        });
    });

    it('should not join a non-existing channel', function (done) {
        var conn = connect(env.url);
        conn.on('connected', () => {
            conn.joinChannel('fakeChannel', false).then(channel => {
                done(new Error('joined a channel that should not exist'));
            }).catch(err => {
                // error case, test passed.
                done();
            });
        });
    });
});
