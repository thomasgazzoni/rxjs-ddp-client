import { test } from 'ava';

import { MyDDPServer } from './_my-ddp-server';
import { MyDDPClient } from './_my-ddp-client';

const myDDPServer = new MyDDPServer();
const myDDPClient = new MyDDPClient();

test.cb('Connect to DDP server', t => {

    myDDPClient.connect();

    setTimeout(() => {

        t.is(myDDPClient.ddpStatus.isConnected, true);

        myDDPClient.getAllCollectionData$('users').take(1).subscribe(items => {
            t.is(items[0]._id, 'test_users');
        });

        t.end();

    }, 1000);
});

test('Check if WebSocket is avaialble', t => {
    if (WebSocket) {
        t.pass();
    } else {
        t.fail('WebSocket is not avaialble');
    }
});
