import { expect } from 'chai';
import * as EJSON from 'ejson';
import 'mocha';

describe('DDPClient', () => {

    describe('after onConnected()', () => {

        describe('on receiving {msg: "connected"}', () => {
            it('should set session id in keystore', () => {

            });
        });

        it('should send a ping to the server', (done) => {
            // let ddpClient = new DDPClient();
            // ddpClient.ping();
        });

    });
});
