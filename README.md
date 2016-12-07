[![Build Status](https://travis-ci.org/thomasgazzoni/rxjs-ddp-client.svg?branch=master)](https://travis-ci.org/thomasgazzoni/rxjs-ddp-client)
[![npm version](https://badge.fury.io/js/rxjs-ddp-client.svg)](https://badge.fury.io/js/rxjs-ddp-client)
[![npm](https://img.shields.io/npm/dm/rxjs-ddp-client.svg)](https://www.npmjs.com/package/rxjs-ddp-client)
[![bitHound Overall Score](https://www.bithound.io/github/thomasgazzoni/rxjs-ddp-client/badges/score.svg)](https://www.bithound.io/github/thomasgazzoni/rxjs-ddp-client)
[![bitHound Dependencies](https://www.bithound.io/github/thomasgazzoni/rxjs-ddp-client/badges/dependencies.svg)](https://www.bithound.io/github/thomasgazzoni/rxjs-ddp-client/master/dependencies/npm)
[![bitHound Code](https://www.bithound.io/github/thomasgazzoni/rxjs-ddp-client/badges/code.svg)](https://www.bithound.io/github/thomasgazzoni/rxjs-ddp-client)

# rxjs-ddp-client
This is a simple WebSocket library for realtime data like Chats, Notification, etc based on DDP protocol:
 - use Meteor-DDP protocol (without the need of Meteor Client) to connect to any Server supporting DDP protocol.
 - use RxJs to handle the collection items in Streams
 - customizable Cache options to persist and load data from cache

Thi library works well together with:
 - https://github.com/yjmade/django-ddp

## Difference with Oortcloud/node-ddp-client
 - Code rewrite using ES6 and Typescript (add typings and interfaces)
 - Usign customizable storage system, not MiniMongo or MiniMongoChange dependencies required
 - Access to collection's data by simple subscribe to Observable allowing to use RxJs operators (no need MiniMongoDb query, etc)

## How it works

```Typescript
import { DDPClient } from "rxjs-ddp-client";

export class MyDDPClient extends DDPClient {

    constructor() {
        super();
    }

    connect() {
        const ddpServerUrl = 'ws://localhost:3000/websocket';
        super.connect(ddpServerUrl);
    }

    login(sessionId: string) {
        const params = {
            ftsession: sessionId
        };
        return this.call('login', [params]);
    }

    logout() {
        this.ddpStorage.clearCache(['MyCollectionA']);
        super.close();
    }

    subscribePubblications() {
        const since = this.ddpStorage.lastSyncTime;
        this.subscribe('myPublicationA', [since]);
        this.subscribe('myPublicationB', [since]);
    }

    observeMyCollections() {
        this.observeCollection<IUser[]>('MyCollectionA')
            .subscribe(items => console.log('MyCollectionA item:', item));
    }

    // Events called by DDPClient

    onConnected() {
        // DDP connected
    }

    onSocketError(error) {
        // Socket error
    }

    onSocketClosed() {
        // WebSocket closed
    }

    onMessage(data) {
        // DDP message received (for custom handling)
    }
}

```

## Install

```sh
npm install thomasgaz/rxjs-ddp-client
```

## Todos
 - Write Tests

## Thanks
 - Thanks to **oortcloud** for the node-ddp-client which formed the inspiration for this code.
 - Thanks to **yjmade** for the improved Django DDP server library

License
----

MIT

[//]: # (These are reference links used in the body of this note and get stripped out when the markdown processor does its job. There is no need to format nicely because it shouldn't be seen. Thanks SO - http://stackoverflow.com/questions/4823468/store-comments-in-markdown-syntax)

   [Typecript]: <http://typscriptlang.org>
