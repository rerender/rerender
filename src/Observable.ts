export type Next<V> = (value: V) => void;
export type ErrorSignature = (error: Error) => void;
export type Complete = () => void;
export type OnConnectSignature<V> = (next: Next<V>, error: ErrorSignature, complete: Complete) => any;

type Listener<V> = [
    (value: V) => any,
    (error: Error) => any,
    () => any
];

export default class Observable<V> {
    private connected: boolean = false;
    private stopped: boolean = false;
    private listeners: Array<Listener<V>> = [];

    constructor(
        private onConnect: OnConnectSignature<V>,
        private autoConnect: boolean = true
    ) {}

    public subscribe(
        onNext: (value: V) => any,
        onError: (error: Error) => any,
        onComplete: () => any
    ) {
        if (this.stopped) {
            return;
        }

        this.listeners.push([onNext, onError, onComplete]);

        if (this.autoConnect) {
            this.connect();
        }
    }

    public unsubscribe(onNext?: (value: V) => any) {
        if (onNext) {
            this.listeners = this.listeners.filter((listener: Listener<V>) =>
                listener[0] !== onNext);
        } else {
            this.listeners = [];
        }
    }

    public connect() {
        if (!this.connected) {
            try {
                this.onConnect(this.next, this.error, this.complete);
            } catch (error) {
                this.error(error);
            }
            this.connected = true;
        }
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
