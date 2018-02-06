import { Dispatcher } from './Dispatcher';
import { NeverResolvePromise } from './Promise';
import { Promise } from './Promise';
import { deepEqual } from './utils';

const crossUserCache = {};

class DispatcherFirstRender extends Dispatcher {
    constructor({
        eventDefaults,
        cacheFromServer,
        isServer = false,
        crossUserCacheEnabled = isServer
    }) {
        super({
            eventDefaults,
            hasInheritance: true
        });

        this.dispatchOriginal = this.dispatch;
        this.dispatch = this.dispatchInsideInit.bind(this);
        this.setActionOptions();

        this.setCacheOriginal = this.setCache;
        this.getCachedOriginal = this.getCached;

        if (isServer) {
            this.crossUserCacheEnabled = crossUserCacheEnabled;
            this.setCache = this.setCacheServer;
            this.getCached = this.getCachedServer;
        } else {
            this.cacheFromServer = cacheFromServer || {};
            this.setCache = this.setCacheOriginal;
            this.getCached = this.getCachedClient;
        }
    }

    beginCatch() {
        this.executionEnabled = true;
        this.catched = [];
    }

    isCatched() {
        return this.catched.length > 0;
    }

    endFirstRender() {
        delete this.cacheFromServer;
        this.setCache = this.setCacheOriginal;
        this.getCached = this.getCachedOriginal;
        this.dispatch = this.dispatchOriginal.bind(this);
        this.setActionOptions();
    }

    waitCatched() {
        return new Promise(resolve => {
            let settledCount = 0;
            const catched = this.catched;
            let catchCount = catched.length;

            const check = item => {
                if (item.result instanceof NeverResolvePromise) {
                    settledCount++;
                } else {
                    item.result.then(settle(item), settle());
                }
            };

            const settle = item => () => {
                settledCount++;
                const newCatchedCount = catched.length;

                if (item && typeof item.event.action === 'function'
                    && this.getEventSetting(item.event, 'cache') && !this.getCachedOriginal(item.event, item.payload)) {
                    this.setCacheOriginal(item.event, item.payload, item.result);
                }

                if (catchCount < newCatchedCount) {
                    const newCatched = catched.slice(catchCount - newCatchedCount);
                    catchCount = newCatchedCount;

                    for (let i = 0, l = newCatched.length; i < l; i++) {
                        check(newCatched[i]);
                    }
                }

                if (catchCount <= settledCount) {
                    this.executionEnabled = false;
                    resolve();
                }
            };

            for (let i = 0; i < catchCount; i++) {
                check(catched[i]);
            }
        });
    }

    getCachedClient(event, payload) {
        const cached = this.getCachedOriginal(event, payload);

        if (cached) {
            return cached;
        }

        const cacheFromServer = this.cacheFromServer;

        if (cacheFromServer[event.name]
            && cacheFromServer[event.name].length > 0) {

            for (let i = 0, l = cacheFromServer[event.name].length; i < l; i++) {
                const cacheItem = cacheFromServer[event.name][i];

                if (cacheItem.name === event.name && deepEqual(cacheItem.payload, payload)) {
                    const result = Promise.resolve(this.getEventSetting(event, 'rehydrate')
                        ? this.getEventSetting(event, 'rehydrate')(cacheItem.result)
                        : cacheItem.result);

                    return {
                        event,
                        payload,
                        result
                    };
                }
            }
        }
    }

    getCachedServer(event, payload) {
        const cached = this.getCachedOriginal(event, payload);

        if (cached) {
            return cached;
        }

        if (this.crossUserCacheEnabled && this.getEventSetting(event, 'crossUser')
            && crossUserCache[event.name] && crossUserCache[event.name].length) {

            for (let i = 0, l = crossUserCache[event.name].length; i < l; i++) {
                const cacheItem = crossUserCache[event.name][i];

                if (cacheItem.event === event && deepEqual(cacheItem.payload, payload)) {
                    return cacheItem.result;
                }
            }
        }
    }

    setCacheServer(event, payload, result) {
        this.setCacheOriginal(event, payload, result);

        if (this.crossUserCacheEnabled && this.getEventSetting(event, 'crossUser') && !this.brokenCacheKeys[event.name]) {
            const cacheByName = crossUserCache[event.name] || (crossUserCache[event.name] = []);
            const item = {
                event,
                payload,
                result
            };

            cacheByName[event.name].push(item);

            const timeout = setTimeout(() => {
                this.dropCacheItem(cacheByName, item);
            }, this.getEventSetting(event, 'serverCacheAge'));

            result.catch(() => {
                clearTimeout(timeout);
                this.dropCacheItem(cacheByName, item);
            });
        }
    }

    dispatchInsideInit(event, payload) {
        if (!this.executionEnabled || this.getEventSetting(event, 'serverDisabled')) {
            return new NeverResolvePromise();
        }

        const result = this.dispatchOriginal(event, payload);

        this.catched.push({
            event,
            payload,
            result
        });

        return result;
    }

    getCache() {
        return this.cache;
    }

    dehydrate() {
        const dehydrated = {};

        for (let name in this.cache) {
            dehydrated[name] = [];

            for (let i = 0, l = this.cache[name].length; i < l; i++) {
                const item = this.cache[name][i];
                const value = item.result['[[PromiseValue]]'];

                dehydrated[name].push({
                    name: item.event.name,
                    payload: item.payload,
                    result: this.getEventSetting(item.event, 'dehydrate')
                        ? this.getEventSetting(item.event, 'dehydrate')(value)
                        : value
                });
            }
        }

        return dehydrated;
    }
}

export { DispatcherFirstRender };
