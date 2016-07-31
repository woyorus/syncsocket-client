var connect = require('../../src/index');

var connection = connect('http://localhost:6024');
connection.join('super-channel', { canPublish: true })
    .then(channel => {
        setTimeout(() => {
            channel.subscribe('hey', () => {
                console.log('prephey');
                setTimeout(() => channel.finalizeTransition(), 500);
            }, () => console.log('fire_hey'));
            channel.publish('hey', { go: true });
        }, 1000);

    })
    .catch(err => console.error(err));
