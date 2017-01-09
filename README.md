[![Build Status](https://travis-ci.org/thomasgazzoni/rxjs-ddp-client.svg?branch=master)](https://travis-ci.org/thomasgazzoni/rxjs-ddp-client)
[![npm version](https://badge.fury.io/js/rxjs-ddp-client.svg)](https://badge.fury.io/js/rxjs-ddp-client)
[![npm](https://img.shields.io/npm/dm/rxjs-ddp-client.svg)](https://www.npmjs.com/package/rxjs-ddp-client)
[![bitHound Overall Score](https://www.bithound.io/github/thomasgazzoni/rxjs-ddp-client/badges/score.svg)](https://www.bithound.io/github/thomasgazzoni/rxjs-ddp-client)
[![bitHound Dependencies](https://www.bithound.io/github/thomasgazzoni/rxjs-ddp-client/badges/dependencies.svg)](https://www.bithound.io/github/thomasgazzoni/rxjs-ddp-client/master/dependencies/npm)
[![bitHound Code](https://www.bithound.io/github/thomasgazzoni/rxjs-ddp-client/badges/code.svg)](https://www.bithound.io/github/thomasgazzoni/rxjs-ddp-client)

# rxjs-ddp-client
This is a simple WebSocket library for realtime app like Chats, Notification, etc based on DDP protocol powered by RXjs
 - use Meteor-DDP protocol (without the need of Meteor Client) to connect to any Server supporting DDP protocol.
 - use RxJs to handle the collection items in Streams
 - customizable Cache options to persist and load data from cache

Thi library works well together with:
 - https://github.com/yjmade/django-ddp

## Difference with Oortcloud/node-ddp-client
 - Code rewrite using ES6 and Typescript (add typings and interfaces)
 - Usign customizable storage system (minimongo-db or minimongo-cache dependencies are NOT required)
 - Access to collection's data by simple subscribe to Observable and use RxJs operators (map, zip, filter, etc) for querying

## Usage Exemple

 - Create a custom DDP class for your app logic

```ts
// my-ddp-client.ts
import { Observable } from 'rxjs';
import { DDPClient } from '../src/ddp-client';
import { DDPCacheEngine } from '../src/ddp-storage';

export type MY_DDP_COLLECTIONS = 'users' | 'chats';
export const MY_DDP_COLLECTIONS = {
    USERS: 'users' as MY_DDP_COLLECTIONS,
    CHATS: 'chats' as MY_DDP_COLLECTIONS,
};

export interface IUser {
    _id: string;
    full_name: string;
    email: string;
}

export class MyDDPClient extends DDPClient {

    public ddpStatus: {
        isConnected: boolean;
        isDisconnected: boolean;
    };

    constructor() {
        super();

        this.ddpStatus = {
            isConnected: false,
            isDisconnected: true,
        };
    }

    initCacheStorage(cacheEngine: DDPCacheEngine) {

        this.ddpStorage.setCacheEngine(cacheEngine);
        this.ddpStorage.loadFromCache([MY_DDP_COLLECTIONS.CHATS]);
    }

    connect() {
        const ddpServerUrl = 'ws://localhost:8080';
        super.connect(ddpServerUrl);
    }

    login() {
        return this.callWithPromise('login', {
            username: 'xxx',
            password: 'xxx'
        });
    }

    logout() {
        this.ddpStorage.clearCache([MY_DDP_COLLECTIONS.CHATS]);
        super.close();
    }

    // Events called by DDPClient
    onConnected() {
        // DDP connected, now we can login and subscribe to the publications on the server

        this.ddpStatus.isConnected = true;
        this.ddpStatus.isDisconnected = false;

        this.login()
            .then(() => {
                this.subscribePublications();
                this.observeCollections();
            });
    }

    onDisconnected() {
        // DDP disconnected, notify user

        this.ddpStatus.isConnected = true;
        this.ddpStatus.isDisconnected = false;
    }

    onSocketError(error) {
        // Custom code on Socket error
    }

    onSocketClosed() {
        // Custom code on Socket closed
    }

    onMessage(data) {
        // Custom code for handle special DDP server messages
    }

    // Custom utility methos
    subscribePublications() {
        const since = this.ddpStorage.lastSyncTime;
        this.subscribe('users', [since]);
        this.subscribe('chats', [since]);
    }

    observeCollections() {
        this.observeCollection<IUser[]>(MY_DDP_COLLECTIONS.USERS)
            .subscribe(items => console.log('Users:', items));
    }

    getAllCollectionData$(collectionName: MY_DDP_COLLECTIONS) {
        // To access data direcly from the collection you can use the ddpStorage methods
        return this.ddpStorage.getObservable(collectionName);
    }
}
```

 - Initialize your custom DDP class in your app main entry point

```ts
import { DDPCacheEngine } from 'rxjs-ddp-client';
import { MyDDPClient } from './my-ddp-client';

const myDDPClient = new MyDDPClient();

// OPTION 1: Wrapper of LocalForage or any storage using Observable (methods must match to DDPCacheEngine interface)
const _storageService : DDPCacheEngine = new MyLocalForageWrapper();

// OPTION 2: if you use Angular 2 you could consider useing the StorageService of ng2-platform ([see ng2-platform repo](https://github.com/thomasgazzoni/ng2-platform))
const _storageService : DDPCacheEngine = this._storageService;


myDDPClient.setCacheEngine(_storageService);
myDDPClient.connect();
```

## Install

```sh
npm install rxjs-ddp-client
```

## Todos
 - Write Tests

## Thanks
 - Thanks to **oortcloud** for the node-ddp-client which formed the inspiration for this code.
 - Thanks to **yjmade** for the Django/PostgreSQL implementation of the Meteor server.

License
----

MIT

[//]: # (These are reference links used in the body of this note and get stripped out when the markdown processor does its job. There is no need to format nicely because it shouldn't be seen. Thanks SO - http://stackoverflow.com/questions/4823468/store-comments-in-markdown-syntax)

   [Typecript]: <http://typscriptlang.org>
