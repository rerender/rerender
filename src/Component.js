import { shallowClone } from './utils';
import { Events } from './Events';
import { VEvent } from './VEvent';
import { debug } from './debug';
import { VComponent } from './VComponent';

class Component extends Events {
    constructor(props, options, id) {
        super();
        this._options = options;
        this._id = id;
        this.state = {};
        this.props = props;
    }

    getStateSnapshot(path) {
        if (this._prevState) {
            delete this._prevState;
        }

        return this.getState(path);
    }

    getState(path) {
        if (path && Array.isArray(path)) {
            let result = this.state;

            for (let i = 0, l = path.length; result !== undefined && i < l; i++) {
                result = result[path[i]];
            }

            return result;
        } else {
            return this.state;
        }
    }

    setState(value, path) {
        if (path && Array.isArray(path)) {
            if (this.getState(path) !== value) {
                if (!this._prevState) {
                    this._prevState = this.state;
                    this.state = shallowClone(this._prevState);
                }

                let stateParent = this.state;
                let prevStateParent = this._prevState;
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

                if (this._componentMounted && !this._settingProps) {
                    this._options.events.emit('rerender-one', this._id);
                }
            }
        } else if (value && typeof value === 'object'){
            const keys = Object.keys(value);

            for (let i = 0, l = keys.length; i < l; i++) {
                this.setState(value[keys[i]], [keys[i]]);
            }
        }
    }

    forceRender() {
        this._options.events.emit('force-render', this._id);
    }

    dispatch(event, payload) {
        return this._options.dispatch.call(null, event, payload);
    }

    trigger(eventName, payload) {
        if (this._componentMounted) {
            const event = new VEvent(eventName, payload);
            let parent = this.getParent();
            while (parent && !event.isStopped()) {
                if (parent instanceof VComponent && parent.ref) {
                    parent.ref.emit(eventName, event);
                }

                parent = parent.getParent();
            }
        } else {
            debug.warn('Try emit event on unmounted component, event not triggered');
        }
    }

    getParent() {
        return this._options.getParent(this._id);
    }

    render() {
        return;
    }
}

export { Component };
