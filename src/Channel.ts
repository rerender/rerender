const noop = () => {};

export type Callback = (payload?: any) => any;

export class Channel {
    private callbacks: {
        [eventName: string]: Callback[]
    };

    public emit(eventName: string, payload?: any): void {
        if (!this.callbacks || !this.callbacks[eventName]) {
            return;
        }

        for (let i = 0, l = this.callbacks[eventName].length; i < l; i++) {
            ((this.callbacks[eventName] || {})[i] || noop)(payload);
        }
    }

    public on(eventName: string, callback: Callback): void {
        if (!this.callbacks) {
            this.callbacks = {};
        }

        if (!this.callbacks[eventName]) {
            this.callbacks[eventName] = [];
        } else if (this.callbacks[eventName].indexOf(callback) !== -1) {
            return;
        }

        this.callbacks[eventName].push(callback);
    }

    public un(eventName: string, callback?: Callback): void {
        if (!this.callbacks || !this.callbacks[eventName]) {
            return;
        }

        if (!callback) {
            delete this.callbacks[eventName];
            return;
        }

        const index = this.callbacks[eventName].indexOf(callback);

        if (index !== -1) {
            this.callbacks[eventName].splice(index, 1);
        }
    }
}
