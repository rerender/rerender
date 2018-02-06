import { deepEqual } from './utils';
import { Store } from './Store';
import { eventDefaults } from './defaults';
import { debug } from './debug';
import { Promise, isPromise } from './Promise';

class Dispatcher {
    constructor(options = {}) {
        this.store = new Store();
        this.cache = options.cache || {};
        this.brokenCacheKeys = {};

        if (options.eventDefaults) {
            this.eventDefaults = {};
            for (let name in eventDefaults) {
                this.eventDefaults[name] = options.eventDefaults[name] !== undefined
                    ? options.eventDefaults[name]
                    : eventDefaults[name];
            }
        } else {
            this.eventDefaults = eventDefaults;
        }

        this.reducerOptions = Object.freeze({
            getState: this.store.getState,
            setState: this.store.setState
        });

        if (!options.hasInheritance) {
            this.dispatch = this.dispatch.bind(this);
            this.setActionOptions();
        }
    }

    setActionOptions() {
        this.actionOptions = Object.freeze({
            dispatch: this.dispatch,
            getState: this.store.getState
        });

        this.actionOptionsInsideCache = Object.freeze({
            dispatch: this.dispatchInsideCache.bind(this),
            getState: this.store.getState
        });
    }

    getEventSetting(event, name) {
        return event[name] !== undefined
            ? event[name]
            : this.eventDefaults[name];
    }

    dispatchInsideCache(event, payload) {
        if (event.reducers !== undefined) {
            debug.warn('Do not use dispatch (event with reducers) inside event with cache enabled! Event ' + event.name + ' may not work correctly');
        }
        this.dispatch(event, payload);
    }

    dispatch(event, payload) {
        return this.runAction(event, payload)
            .then(actionResult => {
                this.runReducers(event, actionResult);

                return actionResult;
            });
    }

    runAction(event, payload) {
        if (typeof event.action !== 'function') {
            return Promise.resolve(payload);
        }

        const cacheEnabled = this.getEventSetting(event, 'cache');

        if (cacheEnabled) {
            const cached = this.getCached(event, payload);

            if (cached !== undefined) {
                return cached;
            }

            const result = this.runActionPure(event, payload);

            this.setCache(event, payload, result);

            return result;
        }

        return this.runActionPure(event, payload);
    }

    runActionPure(event, payload) {
        const actionResult = event.action(
            this.getEventSetting(event, 'cache')
                ? this.actionOptions
                : this.actionOptionsInsideCache,
            payload
        );

        if (isPromise(actionResult)) {
            return actionResult;
        } else {
            return Promise.resolve(actionResult);
        }
    }

    runReducers(event, payload) {
        if (!event.reducers || !event.reducers.length) {
            return;
        }

        for (let i = 0, l = event.reducers.length; i < l; i++) {
            event.reducers[i](this.reducerOptions, payload);
        }
    }

    getCached(event, payload) {
        if (this.cache[event.name]) {
            for (let i = 0, l = this.cache[event.name].length; i < l; i++) {
                const cacheItem = this.cache[event.name][i];
                if (cacheItem.event !== event) {
                    this.brokenCacheKeys[event.name] = true;
                    debug.warn('There are many events with same name ' + event.name + '. Cache for this key will not work!');
                } else if (deepEqual(cacheItem.payload, payload)) {
                    return cacheItem.result;
                }
            }
        }
    }

    setCache(event, payload, result) {
        if (this.brokenCacheKeys[event.name]) {
            return;
        }
        const cacheByName = this.cache[event.name] || (this.cache[event.name] = []);
        const item = {
            event,
            payload,
            result
        };

        cacheByName.push(item);

        result.catch(() => this.dropCacheItem(cacheByName, item));
    }

    dropCacheItem(cacheByName, item) {
        for (let i = 0, l = cacheByName.length; i < l; i++) {
            if (cacheByName[i] === item) {
                cacheByName.splice(i, 1);

                return;
            }
        }
    }
}

export { Dispatcher };
