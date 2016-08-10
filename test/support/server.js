const Server = require('syncsocket');

var server = new Server();
server.createChannel({channelId: 'testChannel'});
server.listen(6066);
