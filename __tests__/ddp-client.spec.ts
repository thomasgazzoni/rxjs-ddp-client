import { WebSocket } from 'mock-socket';
import { take } from 'rxjs/operators';

import { MyDDPServer } from '../example/MyDDPServer';
import { MyDDPClient, MY_DDP_COLLECTIONS } from '../example/MyDDPClient';

const myDDPServer = new MyDDPServer();
myDDPServer.start();

const myDDPClient = new MyDDPClient();

describe('DDP Client Connection', () => {
  it('Must have a WebSocket', () => expect(WebSocket).toBeDefined());

  it('Can Connect', () => {
    const spy = jest.spyOn(myDDPClient, 'connect');
    myDDPClient.connect();
    expect(spy).toReturn();
  });

  it('Wait for connection (1 seconds)', done => {
    setTimeout(() => {
      expect(true).toBeTruthy();
      done();
    }, 1000);
  });

  it('Is Connected', () =>
    expect(myDDPClient.ddpStatus.isConnected).toBeTruthy());

  it('Can Login', async () => {
    const data = await myDDPClient.login();
    expect(data).toBe('mock_session_id');
  });

  it(
    'Subscribe to users collections',
    () => {
      myDDPClient
        .getCollectionData$(MY_DDP_COLLECTIONS.USERS)
        .pipe(take(1))
        .subscribe(items => {
          expect(items[0]._id).toBe('test_users');
        });
    },
  );
});

describe('Test Cache', () => {
  const newMyDDPClient = new MyDDPClient();

  it('Is a new instance', () =>
    expect(newMyDDPClient !== myDDPClient).toBeTruthy());

  it(
    'It has cached users',
    () => {
      myDDPClient
        .getCollectionData$(MY_DDP_COLLECTIONS.USERS)
        .pipe(take(1))
        .subscribe(items => {
          expect(items[0]._id).toBe('test_users');
        });
    },
  );
});
