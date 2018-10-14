import { of } from 'rxjs';
import { DDPCacheEngine } from '../';

export class MyDDPCacheEngine implements DDPCacheEngine {
  constructor() {}

  getItem(keyName: string) {
    return of(localStorage.getItem(keyName));
  }

  setItem(keyName: string, value: any) {
    return of(localStorage.setItem(keyName, value));
  }

  removeItem(keyName: string) {
    return of(localStorage.removeItem(keyName));
  }
}
