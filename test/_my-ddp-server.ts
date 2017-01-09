import { Server } from 'mock-socket';
import * as EJSON from 'ejson';

/**
 * Mock DDP Server
 */
export class MyDDPServer {

    mockServer = new Server('ws://localhost:8080');

    constructor() {

        this.mockServer.on('connection', server => {

            const response = {
                msg: 'connected'
            };

            this.mockServer.send(EJSON.stringify(response));
        });

        this.mockServer.on('message', message => {
            const data = EJSON.parse(message);
            this.mockMessageResponse(data);
        });

    }

    mockMessageResponse(data) {

        let response = {
            msg: 'not_implemented'
        };

        switch (data.msg) {
            case 'connect':
                response.msg = 'connected';
                break;
            case 'ping':
                response.msg = 'pong';
                break;
            case 'method':
                this.mockMethodResponse(data.method, data.id, data.params);
                return;
            case 'sub':
                this.mockSubResponse(data.name, data.id, data.params);
                return;
            default:
                break;
        }

        this.mockServer.send(EJSON.stringify(response));
    }

    mockMethodResponse(method: string, id: number, params: any) {

        let response = {
            msg: 'result',
            id,
            result: undefined,
            error: undefined,
        };

        let responseUpdate = {
            msg: 'updated',
            id
        };

        switch (method) {
            case 'login':
                response.result = 'mock_session_id';
                break;
            default:
                break;
        }

        this.mockServer.send(EJSON.stringify(response));
        this.mockServer.send(EJSON.stringify(responseUpdate));
    }

    mockSubResponse(publicationName: string, id: number, params: any) {

        const response = {
            id: `test_${publicationName}`,
            msg: 'added',
            collection: publicationName,
            fileds: {
                _id: `test_${publicationName}`,
                full_name: 'Test',
                email: 'test@test.com'
            }
        };

        this.mockServer.send(EJSON.stringify(response));
    }
}
