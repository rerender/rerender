export type Next<V> = (value: V) => void;
export type ErrorSignature = (error: Error) => void;
export type Complete = () => void;
export type OnConnectSignature<V> = (next: Next<V>, error: ErrorSignature, complete: Complete) => any;

type Listener<V> = [
    (value: V) => any,
    (error: Error) => any,
    () => any
];

export class Observable<V> {
    private connected: boolean = false;
    private stopped: boolean = false;
    private listeners: Array<Listener<V>> = [];

    constructor(
        private onConnect: OnConnectSignature<V>,
        private autoConnect: boolean = true
    ) {
        this.next = this.next.bind(this);
        this.error = this.error.bind(this);
        this.complete = this.complete.bind(this);
    }

    public subscribe(
        onNext: (value: V) => any,
        onError: (error: Error) => any,
        onComplete: () => any = () => {}
    ) {
        if (this.stopped) {
            return;
        }

        this.listeners.push([onNext, onError, onComplete]);

        if (this.autoConnect) {
            this.connect();
        }

        return this;
    }

    public unsubscribe(onNext?: (value: V) => any) {
        if (onNext) {
            this.listeners = this.listeners.filter((listener: Listener<V>) =>
                listener[0] !== onNext);
        } else {
            this.listeners = [];
        }

        return this;
    }

    public connect() {
        if (!this.connected) {
            this.onConnect(this.next, this.error, this.complete);
            this.connected = true;
        }

        return this;
    }

    private next(value: V) {
        for (let i = 0, l = this.listeners.length; i < l; i++) {
            this.listeners[i][0](value);
        }
    }

    private error(error: Error) {
        for (let i = 0, l = this.listeners.length; i < l; i++) {
            this.listeners[i][1](error);
        }
        this.unsubscribe();
        this.stopped = true;
    }

    private complete() {
        for (let i = 0, l = this.listeners.length; i < l; i++) {
            this.listeners[i][2]();
        }
        this.unsubscribe();
        this.stopped = true;
    }
}
