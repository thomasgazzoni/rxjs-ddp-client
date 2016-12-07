import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';

import { DDP_COLLECTIONS } from './ddp-names';

export declare abstract class DDPCacheEngine {
    abstract get(key: string): Promise<any>;
    abstract set(key: string, value: any): void;
    abstract remove(key: string): void;
}

const STORAGE_KEY_LAST_SYNC_TIME = 'last_sync_time';

/**
 * DDPStorage
 */
export class DDPStorage {

    public get lastSyncTime() {
        return this._lastSyncTime;
    }

    private _lastSyncTime: Date;
    private _cacheEngine: DDPCacheEngine;
    private _collections: {
        [name: string]: Array<any>;
    };
    private _subjects: {
        [name: string]: BehaviorSubject<any>;
    };

    constructor() {

        this._collections = {};
        this._subjects = {};
        this._lastSyncTime = undefined;
    }

    // Store Cache methods
    setCacheEngine(cacheEngine: DDPCacheEngine) {
        this._cacheEngine = cacheEngine;

        this._cacheEngine.get(STORAGE_KEY_LAST_SYNC_TIME)
            .then(data => this._lastSyncTime = data);
    }

    loadFromCache(collectionsNames: Array<DDP_COLLECTIONS>) {

        collectionsNames.forEach(collectionName => {

            this._checkAndInitCollection(collectionName);

            this._cacheEngine.get(collectionName)
                .then(data => {
                    this._collections[collectionName] = data || [];
                    this._subjects[collectionName].next(this._collections[collectionName]);
                })
                .catch(error => {
                    this._collections[collectionName] = [];
                    this._subjects[collectionName].next(this._collections[collectionName]);
                });

        });
    }

    persistToStore(collectionsNames: Array<DDP_COLLECTIONS>) {

        collectionsNames.forEach(collectionName => {

            const data = this._getCollection(collectionName);

            this._cacheEngine.set(collectionName, data);
        });

        this._lastSyncTime = new Date();
        this._cacheEngine.set(STORAGE_KEY_LAST_SYNC_TIME, this._lastSyncTime);
    }

    clearCache(collectionsNames: Array<DDP_COLLECTIONS>) {

        this._lastSyncTime = undefined;
        this._cacheEngine.remove(STORAGE_KEY_LAST_SYNC_TIME);

        collectionsNames.forEach(collectionName => {
            this._collections[collectionName] = [];
            this._subjects[collectionName].next(this._collections[collectionName]);
            this._cacheEngine.remove(collectionName);
        });

    }

    // Get/Set data methods
    getObservable(collectionName: DDP_COLLECTIONS) {

        this._checkAndInitCollection(collectionName);

        return this._subjects[collectionName].asObservable();
    }

    getItem(collectionName: DDP_COLLECTIONS, id) {

        const collection = this._getCollection(collectionName);

        return collection.find(item => item._id === id);
    }

    insertItem(collectionName: DDP_COLLECTIONS, item: any) {
        const collection = this._getCollection(collectionName);

        this._insertOrUpdate(collection, item);

        this._subjects[collectionName].next(collection);
    }

    updateItem(collectionName: DDP_COLLECTIONS, id: any, item: any) {

        const collection = this._getCollection(collectionName);

        this._insertOrUpdate(collection, item);

        this._subjects[collectionName].next(collection);
    }

    removeItem(collectionName: DDP_COLLECTIONS, id: any) {

        let collection = this._getCollection(collectionName);

        this._collections[collectionName] = collection.filter(item => item._id !== id);

        this._subjects[collectionName].next(this._collections[collectionName]);
    }

    private _insertOrUpdate(collection: Array<any>, newItem) {
        const existingItem = collection.find(item => item._id === newItem._id);

        if (existingItem) {
            collection[collection.indexOf(existingItem)] = newItem;
        } else {
            collection.push(newItem);
        }
    }

    private _getCollection(collectionName: DDP_COLLECTIONS): Array<any> {

        this._checkAndInitCollection(collectionName);

        return this._collections[collectionName];
    }

    private _checkAndInitCollection(collectionName: DDP_COLLECTIONS) {
        if (!this._collections[collectionName]) {
            this._collections[collectionName] = [];
        }

        if (!this._subjects[collectionName]) {
            this._subjects[collectionName] = new BehaviorSubject([]);
        }
    }
}
