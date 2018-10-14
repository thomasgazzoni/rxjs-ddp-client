[![Build Status](https://travis-ci.org/thomasgazzoni/rxjs-ddp-client.svg?branch=master)](https://travis-ci.org/thomasgazzoni/rxjs-ddp-client)
[![npm version](https://badge.fury.io/js/rxjs-ddp-client.svg)](https://badge.fury.io/js/rxjs-ddp-client)
[![npm](https://img.shields.io/npm/dm/rxjs-ddp-client.svg)](https://www.npmjs.com/package/rxjs-ddp-client)

# rxjs-ddp-client

This is a simple WebSocket library for real time app like Chats, Notification, etc based on DDP protocol powered by RXjs

- use Meteor-DDP protocol (without the need of Meteor Client) to connect to any Server supporting DDP protocol.
- use RxJs to handle the collection items in Streams
- customizable Cache options to persist and load data from cache

Thi library works well together with:

- https://github.com/yjmade/django-ddp

## Difference with Oortcloud/node-ddp-client

- Code rewrite using ES6 and Typescript (add typings and interfaces)
- Using customizable storage system (minimongo-db or minimongo-cache dependencies are NOT required)
- Access to collection's data by simple subscribe to Observable and use RxJs operators (map, zip, filter, etc) for querying

## Install

```sh
npm install rxjs-ddp-client
```

## Usage Example

- First you need to create a [custom DDPClient](/example/MyDDPClient.ts) class that will extend from the base class **DDPClient** (for a complete example see the file MyDDPClient.ts).
- In this custom DDPClient class you need to implement all your DDP app logic (Login, Collections names, DDP server url, etc)

```ts
// example/MyDDPClient.ts
//...

// Define your collections names
export enum MY_DDP_COLLECTIONS  {
  USERS = 'users',
  CHATS = 'chats',
}

// Class methods implementations

  connect() {
    const ddpServerUrl = 'ws://localhost:8080';
    super.connect(ddpServerUrl);
  }

  login() {
    return this.callWithPromise('login', {
      username: 'xxx',
      password: 'xxx',
    });
  }

  // Events called by DDPClient
  onConnected() {
    // DDP connected, now we can login and subscribe to the publications on the server

    this.ddpStatus.isConnected = true;
    this.ddpStatus.isDisconnected = false;

    // Example: Login automatically when WebSocket is connected
    this.login().then(() => {
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

  // ...
}
```

- rxjs-ddp-client comes with the data cache out of the box. To keep things flexible, you can use any cache system by implementing a class like [MyDDPCacheEngine](/example/MyDDPCacheEngine.ts) that has the methods required by **_DDPCacheEngine_** interface.
  For example if you chose to use LocalStorage as cache engine you need a class like this:

```ts
// example/MyDDPCacheEngine.ts

export class MyDDPCacheEngine implements DDPCacheEngine {
  constructor() {}

  getItem(keyName: string) {
    return Observable.of(localStorage.getItem(keyName));
  }

  setItem(keyName: string, value: any) {
    return Observable.of(localStorage.setItem(keyName, value));
  }

  removeItem(keyName: string) {
    return Observable.of(localStorage.removeItem(keyName));
  }
}
```

- Ultimately you can initialize your custom DDP client in your app main entry point

VanillaJS

```ts
// app.ts
import { DDPCacheEngine } from 'rxjs-ddp-client';
import { MyDDPClient, MyDDPCacheEngine } from './src/utils/ddp';

const myDDPClient = new MyDDPClient();

// OPTION 1: Wrapper of LocalForage or any storage using Observable (methods must match to DDPCacheEngine interface)
// const _storageService = new MyLocalForageWrapper();

// OPTION 2: if you use Angular 2 you could consider using the StorageService of ng2-platform ([see ng2-platform repo](https://github.com/thomasgazzoni/ng2-platform))
// const _storageService = this._storageService; // Need to declare StorageService in the constructor

// OPTION 3: use the browser localStorage (using the example file my-ddp-cache-engine.ts above)
const _storageService = MyDDPCacheEngine;

myDDPClient.setCacheEngine(_storageService);
myDDPClient.connect();
```

Angular 2+

```ts
// app.component.ts
import { Component } from '@angular/core';
import { MyDDPClient } from './my-ddp-client';
import { MyDDPCacheEngine } from './my-ddp-cache-engine';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'app';

  constructor() {
    this.init();
  }

  init() {
    const myDDPClient = new MyDDPClient();
    const myDDPCacheEngine = new MyDDPCacheEngine();

    myDDPClient.initCacheStorage(myDDPCacheEngine);
    myDDPClient.connect();
  }
}
```

## Thanks

- Thanks to **oortcloud** for the node-ddp-client which formed the inspiration for this code.
- Thanks to **yjmade** for the Django/PostgreSQL implementation of the Meteor server.

## License

MIT

[//]: # "These are reference links used in the body of this note and get stripped out when the markdown processor does its job. There is no need to format nicely because it shouldn't be seen. Thanks SO - http://stackoverflow.com/questions/4823468/store-comments-in-markdown-syntax"
[typescript]: http://typscriptlang.org
