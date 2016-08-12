const Server = require('syncsocket');

var server = new Server({ embeddedTimeserver: true });
server.createChannel('testChannel');
server.listen(6066);
