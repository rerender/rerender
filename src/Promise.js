const PENDING = 'pending';
const RESOLVED = 'resolved';
const REJECTED = 'rejected';
const STATUS = '[[PromiseStatus]]';
const VALUE = '[[PromiseValue]]';
const RESOLVE = '[[PromiseResolve]]';
const REJECT = '[[PromiseReject]]';

function Promise(fn) {
    try {
        if (typeof fn !== 'function') {
            throw new Error('Promise resolver ' + typeof fn + ' is not a function');
        }

        this[RESOLVE] = this[RESOLVE].bind(this);
        this[REJECT] = this[REJECT].bind(this);

        fn(this[RESOLVE], this[REJECT]);
    } catch (error) {
        this[REJECT](error);
    }
}

Promise.prototype = {
    then(onFulfilled = identity, onRejected = identity) {
        if (this[STATUS] === RESOLVED) {
            return Promise.resolve(onFulfilled(this[VALUE]));
        } else if (this[STATUS] === REJECTED) {
            return Promise.reject(onRejected(this[VALUE]));
        } else {
            return new Promise((resolve, reject) => {
                (this._fulfilledCallbacks || (this._fulfilledCallbacks = [])).push(payload => resolve(onFulfilled(payload)));
                (this._rejectedCallbacks || (this._rejectedCallbacks = [])).push(error => reject(onRejected(error)));
            });
        }
    },

    catch(onRejected = identity) {
        if (this[STATUS] === REJECTED) {
            return Promise.reject(onRejected(this[VALUE]));
        } else if (this[STATUS] === PENDING) {
            return new Promise((resolve, reject) => {
                (this._fulfilledCallbacks || (this._fulfilledCallbacks = [])).push(payload => resolve(payload));
                (this._rejectedCallbacks || (this._rejectedCallbacks = [])).push(error => reject(onRejected(error)));
            });
        } else {
            return this;
        }
    },

    [STATUS]: PENDING,

    [RESOLVE]: function(payload) {
        if (this[STATUS] === PENDING) {
            if (isPromise(payload)) {
                payload.then(this[RESOLVE], this[REJECT]);
            } else {
                this[STATUS] = RESOLVED;
                this[VALUE] = payload;

                if (this._fulfilledCallbacks) {
                    for (let i = 0, l = this._fulfilledCallbacks.length; i < l; i++) {
                        this._fulfilledCallbacks[i](payload);
                    }
                }
            }
        }
    },

    [REJECT]: function(error) {
        if (this[STATUS] === PENDING) {
            this[STATUS] = REJECTED;
            this[VALUE] = error;

            if (this._rejectedCallbacks) {
                for (let i = 0, l = this._rejectedCallbacks.length; i < l; i++) {
                    this._rejectedCallbacks[i](error);
                }
            }
        }
    }
};

Promise.resolve = payload => {
    return new Promise(resolve => resolve(payload));
};

Promise.reject = error => {
    return new Promise((resolve, reject) => reject(error));
};

function isPromise(payload) {
    return payload instanceof Promise
        || (payload !== null && typeof payload === 'object'
        && typeof payload.then === 'function' && typeof payload.catch === 'function');
}

function identity(payload) {
    return payload;
}

class NeverResolvePromise extends Promise {
    constructor() {
        super(() => {});
    }

    then() {
        return this;
    }

    catch() {
        return this;
    }
}

export { Promise, isPromise, NeverResolvePromise };
