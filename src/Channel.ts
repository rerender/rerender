const noop = () => {};

export type Listener = (payload?: any) => any;

export class Channel {
    private listeners?: {
        [eventName: string]: Listener[]
    };

    public emit(eventName: string, payload?: any): void {
        if (!this.listeners || !this.listeners[eventName]) {
            return;
        }

        for (let i = 0, l = this.listeners[eventName].length; i < l; i++) {
            ((this.listeners[eventName] || {})[i] || noop)(payload);
        }
    }

    public on(eventName: string, listener: Listener): void {
        if (!this.listeners) {
            this.listeners = {};
        }

        if (!this.listeners[eventName]) {
            this.listeners[eventName] = [];
        } else if (this.listeners[eventName].indexOf(listener) !== -1) {
            return;
        }

        this.listeners[eventName].push(listener);
    }

    public un(eventName: string, listener?: Listener): void {
        if (!this.listeners || !this.listeners[eventName]) {
            return;
        }

        if (!listener) {
            delete this.listeners[eventName];
            return;
        }

        const index = this.listeners[eventName].indexOf(listener);

        if (index !== -1) {
            this.listeners[eventName].splice(index, 1);
        }
    }
}
