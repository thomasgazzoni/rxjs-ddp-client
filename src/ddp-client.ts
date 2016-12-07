import { Observable } from 'rxjs/Observable';
import EJSON from 'ejson';
import _ from 'underscore';
import { DDPStorage } from './ddp-storage';
import { DDP_COLLECTIONS } from './ddp-names';

export declare abstract class OnDDPMessage {
    abstract onMessage(data): void;
}

export declare abstract class OnDDPConnected {
    abstract onConnected(): void;
}

export declare abstract class OnDDPFailed {
    abstract onFailed(): void;
}

export declare abstract class OnSocketClosed {
    abstract onSocketClosed(event): void;
}

export declare abstract class OnSocketError {
    abstract onSocketError(error): void;
}

export interface IDDPClientSettings {
    host?: string;
    port?: number;
    ssl?: boolean;
    path?: string;
    ddpVersion?: string;
    socketContructor?: any;
}

const SUPPORTED_DDP_VERSIONS = ['1', 'pre2', 'pre1'];

export class DDPClient implements OnDDPMessage, OnDDPConnected, OnDDPFailed, OnSocketClosed, OnSocketError {

    protected _isConnecting: boolean;
    protected _isConnected: boolean;
    protected _isClosed: boolean;

    protected _nextId: number;
    protected _callbacks: { [key: number]: Function };
    protected _updatedCallbacks: { [key: number]: Function };
    protected _pendingMethods: { [key: number]: Function };

    protected session: string;
    protected socket: WebSocket;
    protected ddpSettings: IDDPClientSettings;
    protected ddpStorage: DDPStorage;
    protected socketConstructor: WebSocket | any;

    constructor(ddpSettings?: IDDPClientSettings) {

        // default settings
        this.ddpSettings = Object.assign({}, ddpSettings, {
            host: 'localhost',
            port: 3000,
            path: 'websocket',
            ssl: false,
            ddpVersion: '1',
            socketContructor: WebSocket
        });

        this.ddpStorage = new DDPStorage();

        // internal stuff to track callbacks
        this._isConnecting = false;
        this._isConnected = false;
        this._isClosed = false;
        this._nextId = 0;
        this._callbacks = {};
        this._updatedCallbacks = {};
        this._pendingMethods = {};
    }

    // Events that parent can attach to
    onSocketError(error) {

    }

    onSocketClosed(event) {

    }

    onMessage(data) {

    }

    onConnected() {

    }

    onFailed() {

    }

    //////////////////////////////////////////////////////////////////////////

    /*
     * Open the connection to the server
     * if Url is provided, we connect directily to the url instead of using the DDPClientSettings
     */
    connect(url = undefined) {

        this._isConnecting = true;
        this._isConnected = false;
        this._isClosed = false;

        const webSocketUrl = url || this._createUrlFromSettings();

        if (this.socket) {
            delete this.socket;
        }

        this.socket = new this.ddpSettings.socketContructor(webSocketUrl);

        this.socket.onopen = () => {
            // just go ahead and open the "connection" on connect
            this._send({
                msg: 'connect',
                version: this.ddpSettings.ddpVersion,
                support: SUPPORTED_DDP_VERSIONS
            });
        };

        this.socket.onerror = (error) => {
            // error received before connection was established
            if (this._isConnecting) {
                this._failed('Socket error happened before the connection', error);
            }

            this.onSocketError(error);
        };

        this.socket.onclose = (event) => {
            this._isConnecting = false;
            this._isConnected = false;
            this._isClosed = true;

            this._endPendingMethodCalls();

            this.onSocketClosed(event);
        };

        this.socket.onmessage = (event) => {
            this._message(event.data);
        };
    }

    close() {

        this._isConnecting = false;
        this._isConnected = false;
        this._isClosed = true;

        if (this.socket) {
            this.socket.onclose = () => { };
            this.socket.onerror = () => { };
            if (this.socket.readyState !== this.socket.CLOSED) {
                this.socket.close(4000, 'safely_close');
            }
        }
    }

    ping() {

        this._send({
            msg: 'ping'
        });
    }

    /**
     * @whatItDoes call a method on the server
     * @description
     * @param {string} name of the DDP method to call
     * @param {any} object containing the params to send to the method (encode as EJSON)
     * @param {Function} callback called with the result when the server respond RESULT
     * @param {Function} updatedCallback called when the server respond UPDATE
     */
    protected call(name: string, params, callback: Function, updatedCallback: Function) {

        const id = this._getNextId();

        const _self = this;
        this._callbacks[id] = function () {
            delete _self._pendingMethods[id];

            if (callback) {
                callback.apply(this, arguments);
            }
        };

        this._updatedCallbacks[id] = function () {
            delete _self._pendingMethods[id];

            if (updatedCallback) {
                updatedCallback.apply(this, arguments);
            }
        };

        this._pendingMethods[id] = true;

        const sendStatus = this._send({
            msg: 'method',
            id: id,
            method: name,
            params: params
        });

        if (!sendStatus) {
            this._notifySendFail(id);
        }
    }

    protected callWithRandomSeed(name: string, params, randomSeed, callback, updatedCallback) {

        const id = this._getNextId();

        if (callback) {
            this._callbacks[id] = callback;
        }

        if (updatedCallback) {
            this._updatedCallbacks[id] = updatedCallback;
        }

        const sendStatus = this._send({
            msg: 'method',
            id: id,
            method: name,
            randomSeed: randomSeed,
            params: params
        });

        if (!sendStatus) {
            this._notifySendFail(id);
        }
    }

    /**
     * open a subscription on the server,
     * callback should handle on ready and nosub
     */
    protected subscribe(name: string, params, callback) {

        const id = this._getNextId();

        if (callback) {
            this._callbacks[id] = callback;
        }

        const sendStatus = this._send({
            msg: 'sub',
            id: id,
            name: name,
            params: params
        });

        if (!sendStatus) {
            this._notifySendFail(id);
        }

        return id;
    }

    protected unsubscribe(id: string) {

        this._send({
            msg: 'unsub',
            id: id
        });
    }

    protected observeCollection<T>(collectionName: DDP_COLLECTIONS) {
        return this.ddpStorage.getObservable(collectionName) as Observable<T>;
    }

    protected getItemFromCollection(collectionName: DDP_COLLECTIONS, value: any, fieldName = '_id') {

        // const query = {};
        // query[fieldName] = value;

        const itemsFound = this.ddpStorage.getItem(collectionName, value);

        return itemsFound;
    }

    protected convertToEJSON(data) {
        return EJSON.stringify(data);
    }

    // handle send msg via WebSocket
    private _send(data) {

        if (!this.socket || this.socket.readyState !== this.socket.OPEN) {
            console.info('DDP connection is not yet open, Cannot call', data);
            return false;
        }

        this.socket.send(
            this.convertToEJSON(data)
        );

        return true;
    }

    /**
     * handle a message from the server
     */
    private _message(data) {

        data = EJSON.parse(data);

        this.onMessage(data);

        let cb = undefined;

        switch (data.msg) {
            case 'failed':
                if (SUPPORTED_DDP_VERSIONS.indexOf(data.version) !== -1) {
                    this.ddpSettings.ddpVersion = data.version;
                    this._failed('Server and client have different DDP version');
                } else {
                    this._failed('Cannot negotiate DDP version');
                }
                break;
            case 'connected':
                this.session = data.session;
                this._connected();
                break;
            // method result
            case 'result':
                cb = this._callbacks[data.id];

                if (cb) {
                    cb(data.error, data.result);
                    delete this._callbacks[data.id];
                }
                break;
            // method updated
            case 'updated':
                _.each(data.methods, (method: string) => {
                    cb = this._updatedCallbacks[method];

                    if (cb) {
                        cb();
                        delete this._updatedCallbacks[method];
                    }
                });
                break;
            // missing subscription
            case 'nosub':
                cb = this._callbacks[data.id];

                if (cb) {
                    cb(data.error);
                    delete this._callbacks[data.id];
                }
                break;
            // add document to collection
            case 'added':
                if (data.collection) {
                    const collectionName = data.collection;
                    const id = data.id;
                    const item = {
                        '_id': id
                    };

                    if (data.fields) {
                        _.each(data.fields, (value, key) => {
                            item[key] = value;
                        });
                    }

                    this.ddpStorage.insertItem(collectionName, item);
                }
                break;
            // remove document from collection
            case 'removed':
                if (data.collection) {
                    const collectionName = data.collection;
                    const id = data.id;

                    this.ddpStorage.removeItem(collectionName, id);
                }
                break;
            // change document in collection
            case 'changed':
                if (data.collection) {
                    const collectionName = data.collection;
                    const id = data.id;
                    const item = {
                        '_id': id
                    };

                    if (data.fields) {
                        _.each(data.fields, (value, key) => {
                            item[key] = value;
                        });
                    }

                    this.ddpStorage.updateItem(collectionName, id, item);
                }
                break;
            // subscriptions ready
            case 'ready':
                _.each(data.subs, (id: string) => {
                    cb = this._callbacks[id];
                    if (cb) {
                        cb();
                        delete this._callbacks[id];
                    }
                });
                break;
            // minimal heartbeat response for ddp pre2
            case 'ping':
                this._send(
                    _.has(data, 'id') ? { msg: 'pong', id: data.id } : { msg: 'pong' }
                );
                break;
            // server respond to my ping
            case 'pong':
                // TODO: set up a system to detect if the server did not respond to my ping (server down)
                break;
            // Beep
            case 'beep':
                // Handle by the parent
                break;
            case 'server_id':
                // Server just tell us his ID
                break;
            // Error
            case 'error':
                console.warn('DDP error', data.error, data.reason);
                break;
            default:
                console.warn('DDP cannot handle this message', data);
                break;
        }
    }

    // handle DDP connected (ddp msg received from Server)
    private _connected() {

        if (this.socket.readyState === this.socket.CLOSED) {
            console.warn('Socket not stable, wait for socket to connect or fail');
        } else {
            this._isConnecting = false;
            this._isConnected = true;
            this._isClosed = false;
            this.onConnected();
        }
    }

    // handle DDP failed to connect (msg refuse from Server)
    private _failed(errorMessage, exception = undefined) {
        this._isConnecting = false;
        this._isConnected = false;
        this._isClosed = true;

        this.onFailed();
    }

    private _notifySendFail(id) {
        const cb = this._callbacks[id];

        if (cb) {
            cb('Connection to the server failed', undefined);
            delete this._callbacks[id];
        }
    }

    private _createUrlFromSettings() {

        const path = (this.ddpSettings.path.indexOf('/') === 0) ? this.ddpSettings.path : '/' + this.ddpSettings.path;
        const protocol = this.ddpSettings.ssl ? 'wss://' : 'ws://';
        const url = `${protocol}${this.ddpSettings.host}:${this.ddpSettings.port}${path}`;

        return url;
    }

    private _getNextId() {
        return (this._nextId += 1).toString();
    }

    private _endPendingMethodCalls() {

        const ids = _.keys(this._pendingMethods);
        this._pendingMethods = {};

        ids.forEach((id) => {
            if (this._callbacks[id]) {
                this._callbacks[id](new Error('DDPClient: Disconnected from DDP server'));
                // delete this._callbacks[id];
            }

            if (this._updatedCallbacks[id]) {
                this._updatedCallbacks[id]();
                // delete this._updatedCallbacks[id];
            }
        });
    }

}
