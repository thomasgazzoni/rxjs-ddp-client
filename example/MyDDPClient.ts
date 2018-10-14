// For this example use a mock WebSocket.
// in React Native or Angular we can use the global WebSocket or SockJs
import { WebSocket } from 'mock-socket';
// Change this to from 'rxjs-ddp-client';
import { DDPClient, DDPCacheEngine } from '../';
// Cache storage implementation (using LocalStorage)
import { MyDDPCacheEngine } from './MyDDPCacheEngine';

// Define your collections names
export enum MY_DDP_COLLECTIONS {
  USERS = 'users',
  CHATS = 'chats',
}

// This is how a user is represented on the server
export interface IUser {
  _id: string;
  full_name: string;
  email: string;
}

/**
 * DDP Client implementation
 * Handle connection, login and collections subscriptions
 */
export class MyDDPClient extends DDPClient {
  ddpStatus: {
    isConnected: boolean;
    isDisconnected: boolean;
  };

  constructor() {
    super({
      socketConstructor: WebSocket,
    });

    this.ddpStatus = {
      isConnected: false,
      isDisconnected: true,
    };

    this.initCacheStorage(new MyDDPCacheEngine());
  }

  initCacheStorage(cacheEngine: DDPCacheEngine) {
    this.ddpStorage.setCacheEngine(cacheEngine);
    this.ddpStorage.loadFromCache([
      MY_DDP_COLLECTIONS.USERS,
      MY_DDP_COLLECTIONS.CHATS,
    ]);
  }

  connect() {
    const ddpServerUrl = 'ws://localhost:8080';
    return super.connect(ddpServerUrl);
  }

  login() {
    return this.callWithPromise('login', {
      username: 'xxx',
      password: 'xxx',
    });
  }

  logout() {
    this.ddpStorage.clearCache([
      MY_DDP_COLLECTIONS.USERS,
      MY_DDP_COLLECTIONS.CHATS,
    ]);
    super.close();
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

  onSocketClosed() {
    // Custom code on Socket closed
  }

  onMessage(data) {
    // Custom code for handle special DDP server messages
  }

  // Custom utility methods
  subscribePublications() {
    const since = this.ddpStorage.lastSyncTime;
    this.subscribe(MY_DDP_COLLECTIONS.USERS, [since]);
    this.subscribe(MY_DDP_COLLECTIONS.CHATS, [since]);
  }

  observeCollections() {
    this.observeCollection<IUser[]>(MY_DDP_COLLECTIONS.USERS).subscribe(
      items => {
        // NOTE: here you can do some actions when the server send us some new users data
        // for example automatic logout
      },
    );
  }

  getCollectionData$(collectionName: MY_DDP_COLLECTIONS) {
    // To access data directly from the collection you can use the ddpStorage methods
    return this.ddpStorage.getObservable(collectionName);
  }
}
