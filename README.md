# syncsocket-client

Synchronized messaging application framework client

# API Docs

## Channel

[src/channel.js:22-38](https://github.com/woyorus/syncsocket-client/blob/aa7c8a72d7d00de59ffd5aed07e4f12f94809dc6/src/channel.js#L22-L38 "Source code on GitHub")

Channel constructor

**Parameters**

-   `connection`  
-   `opts` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** Connection options
    -   `opts.channelId` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** The channel identifier
    -   `opts.isPublisher` **[Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** Flag whether or not user can publish to this channel

### subscribe

[src/channel.js:89-94](https://github.com/woyorus/syncsocket-client/blob/aa7c8a72d7d00de59ffd5aed07e4f12f94809dc6/src/channel.js#L89-L94 "Source code on GitHub")

Subscribes for messages on given `topic`.
Subscribing to topic `#` will make you subscribe to any message in the channel.

**Parameters**

-   `topic`  
-   `callbackPrepare`  \-- The callback called during prepare transition
-   `callbackFire`  \-- The callback called during the 'fire' event

Returns **[Channel](#channel)** 

### publish

[src/channel.js:103-122](https://github.com/woyorus/syncsocket-client/blob/aa7c8a72d7d00de59ffd5aed07e4f12f94809dc6/src/channel.js#L103-L122 "Source code on GitHub")

Publishes a message to the channel

**Parameters**

-   `topic`  
-   `data`  

Returns **[Channel](#channel)** 
