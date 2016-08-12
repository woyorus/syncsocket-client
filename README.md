# SyncSocket-client

Synchronized messaging application framework client

[![Build Status](https://travis-ci.org/woyorus/syncsocket-client.svg?branch=master)](https://travis-ci.org/woyorus/syncsocket-client) [![codecov](https://codecov.io/gh/woyorus/syncsocket-client/branch/master/graph/badge.svg)](https://codecov.io/gh/woyorus/syncsocket-client) [![npm](https://img.shields.io/npm/v/syncsocket-client.svg?maxAge=2592000)](<>) [![npm](https://img.shields.io/npm/dm/syncsocket-client.svg?maxAge=2592000)]() [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

## API Docs

### Channel

Channel constructor

**Parameters**

-   `connection`  
-   `spec` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** Connection options
    -   `spec.channelId` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** The channel identifier
    -   `spec.isPublisher` **[Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** Flag whether or not user can publish to this channel

#### subscribe

Subscribes for messages on given `topic`.
Subscribing to topic `#` will make you subscribe to any message in the channel.

**Parameters**

-   `topic` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** 
-   `prepareCallback` **function (Any): Any** The callback called during prepare transition
-   `fireCallback` **function (Any): Any** The callback called during the 'fire' event

#### publish

Publishes a user message to the channel

**Parameters**

-   `topic` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** 
-   `data` **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** 

### Channel#transition

Channel switched state

**Properties**

-   `from` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** State transition was from
-   `to` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** State transitioned to

### Channel#error

Error in channel

### Channel#syncSuccessful

Synchronization with timeserver succeeded

**Properties**

-   `error` **[number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)** Reading's max variation from truth (ms)
-   `adjust` **[number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)** Difference between local and remote clocks (ms)

### Channel#syncFailed

Synchronization with timeserver failed

**Properties**

-   `error` **[number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)** Reading's max variation from truth (ms)
-   `adjust` **[number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)** Difference between local and remote clocks (ms)

### Connection

Creates new `Connection` object

**Parameters**

-   `uri`  URI of SyncSocket server (e.g. <http://localhost:5579>)

#### close

Disconnects from the server

#### joinChannel

Attempt joining a channel with id `channelId`.

**Parameters**

-   `channelId`  
-   `canPublish`  

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)** Fulfilled promise returns the `Channel` object, rejected — error message.

### Connection#connected

Client successfully connected to server

### Connection#error

Connection error

### Connection#disconnected

Client disconnected from server

### Connection#connection-error

Error while connecting to server

### connect

Attempts connection to a SyncSocket server.

**Parameters**

-   `uri` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** Server URI

Returns **[Connection](#connection)** `Connection` object.

## connect

Attempts connection to a SyncSocket server.

**Parameters**

-   `uri` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** Server URI

Returns **[Connection](#connection)** `Connection` object.

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
-   `prepareCallback` **function (Any): Any** -- The callback called during prepare transition
-   `fireCallback` **function (Any): Any** -- The callback called during the 'fire' event

### publish

Publishes a user message to the channel

**Parameters**

-   `topic` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** 
-   `data` **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** 
