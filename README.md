# syncsocket-client

Synchronized messaging application framework client

[![Travis](https://img.shields.io/travis/woyorus/syncsocket-client.svg?maxAge=2592000)]() [![Codecov](https://img.shields.io/codecov/c/github/woyorus/syncsocket-client.svg?maxAge=2592000)]()


# API Docs

## Channel

Channel constructor

**Parameters**

-   `connection`  
-   `spec` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** Connection options
    -   `spec.channelId` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** The channel identifier
    -   `spec.isPublisher` **[Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** Flag whether or not user can publish to this channel

### subscribe

Subscribes for messages on given `topic`.
Subscribing to topic `#` will make you subscribe to any message in the channel.

**Parameters**

-   `topic` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** 
-   `prepareCallback` **function (Any): Any** \-- The callback called during prepare transition
-   `fireCallback` **function (Any): Any** \-- The callback called during the 'fire' event

### publish

Publishes a user message to the channel

**Parameters**

-   `topic` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** 
-   `data` **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** 

## Connection

Creates new `Connection` object

**Parameters**

-   `uri`  URI of SyncSocket server (e.g. <http://localhost:5579>)

### close

Disconnects from the server

### joinChannel

Attempt joining a channel with id `channelId`.

**Parameters**

-   `channelId`  
-   `canPublish`  

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)** Fulfilled promise returns the `Channel` object, rejected — error message.

## connect

Attempts connection to a SyncSocket server.

**Parameters**

-   `uri` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** Server URI

Returns **[Connection](#connection)** `Connection` object.
