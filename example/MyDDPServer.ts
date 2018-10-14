import { Server } from 'mock-socket';
import * as EJSON from 'ejson';

/**
 * Mock DDP Server
 * This could be a Node Js implementation as well
 */
export class MyDDPServer {
  start() {
    const mockServer = new Server('ws://localhost:8080');

    mockServer.on('connection', _ => {
      const response = {
        msg: 'connected',
      };

      mockServer.send(EJSON.stringify(response));

      mockServer.on('message', message => {
        const data = EJSON.parse(message);
        this.mockMessageResponse(mockServer, data);
      });
    });
  }

  mockMessageResponse(server: WebSocket, data) {
    let response = {
      msg: 'not_implemented',
    };

    switch (data.msg) {
      case 'connect':
        response.msg = 'connected';
        break;
      case 'ping':
        response.msg = 'pong';
        break;
      case 'method':
        this.mockMethodResponse(server, data.method, data.id, data.params);
        return;
      case 'sub':
        this.mockSubResponse(server, data.name, data.id, data.params);
        return;
      default:
        break;
    }

    server.send(EJSON.stringify(response));
  }

  mockMethodResponse(
    server: WebSocket,
    method: string,
    id: number,
    params: any,
  ) {
    let response = {
      msg: 'result',
      id,
      result: undefined,
      error: undefined,
    };

    let responseUpdate = {
      msg: 'updated',
      id,
    };

    switch (method) {
      case 'login':
        response.result = 'mock_session_id';
        break;
      default:
        break;
    }

    server.send(EJSON.stringify(response));
    server.send(EJSON.stringify(responseUpdate));
  }

  mockSubResponse(
    server: WebSocket,
    publicationName: string,
    id: number,
    params: any,
  ) {
    const response = {
      id: `test_${publicationName}`,
      msg: 'added',
      collection: publicationName,
      fields: {
        _id: `test_${publicationName}`,
        full_name: 'Test',
        email: 'test@test.com',
      },
    };

    server.send(EJSON.stringify(response));
  }
}
