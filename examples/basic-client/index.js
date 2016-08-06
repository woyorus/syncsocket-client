var connect = require('../../src/index');

var connection = connect('http://localhost:6024');
connection.joinChannel('super-channel', true)
    .then(channel => {
        channel.on('syncSuccessful', () => channelSynchronized(channel));
    })
    .catch(err => console.error(err));


function channelSynchronized(channel) {
    console.log('im ready');
    channel.subscribe('hi',
        function (data) {
            // Prepare callback
            console.log("I'm getting ready...");
        }, function (data) {
            // Fire callback
            console.log("Boom!");
        }
    );
    channel.publish('hi', {});
}

