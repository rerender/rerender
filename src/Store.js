import { Events } from './Events';
import { shallowClone } from './utils';

class Store extends Events {
    constructor({ state = {}, dehydrate, rehydrate } = {}) {
        super();

        this.setState = this.setState.bind(this);
        this.getState = this.getState.bind(this);

        this.state = state;
        if (rehydrate) {
            rehydrate({ getState: this.getState, setState: this.setState });
        }

        if (typeof dehydrate === 'function') {
            this.providedDehydrate = dehydrate;
        }
    }

    dehydrate() {
        return this.providedDehydrate
            ? this.providedDehydrate({ getState: this.getState })
            : this.getState();
    }

    getStateSnapshot(path) {
        if (this.prevState) {
            delete this.prevState;
        }

        return this.getState(path);
    }

    getState(path) {
        if (path) {
            let result = this.state;

            for (let i = 0, l = path.length; result !== undefined && i < l; i++) {
                result = typeof result === 'object' ? result[path[i]] : undefined;
            }

            return result;
        } else {
            return this.state;
        }
    }

    setState(value, path) {
        if (path && Array.isArray(path)) {
            if (this.getState(path) !== value) {
                if (!this.prevState) {
                    this.prevState = this.state;
                    this.state = shallowClone(this.prevState);
                }

                let stateParent = this.getState();
                let prevStateParent = this.prevState;
                let last = path.length - 1;

                for (let i = 0, l = last; i < l; i++) {
                    if (prevStateParent && typeof prevStateParent[path[i]] === 'object') {
                        if (stateParent[path[i]] === prevStateParent[path[i]]) {
                            stateParent[path[i]] = shallowClone(prevStateParent[path[i]]);
                        }
                        prevStateParent = prevStateParent[path[i]] || undefined;
                    } else {
                        stateParent[path[i]] = typeof path[i + 1] === 'number' ? [] : {};
                    }

                    stateParent = stateParent[path[i]];
                }

                stateParent[path[last]] = value;
                this.emit('change');
            }
        } else if (value !== this.state) {
            this.state = value;
            this.emit('change');
        }
    }
}

export { Store };
