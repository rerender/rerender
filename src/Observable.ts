export type Next<V> = (value: V, additional?: any) => void;
export type ErrorSignature = (error: Error) => void;
export type Complete = () => void;
export type OnConnectSignature<V> = (next: Next<V>, error: ErrorSignature, complete: Complete) => any;

type Listener<V> = [
    Next<V>,
    ErrorSignature,
    Complete
];

export type ObservableConfig = {
    autoConnect?: boolean
};

export class Observable<V> {
    private connected: boolean = false;
    private stopped: boolean = false;
    private listeners: Array<Listener<V>> = [];
    private autoConnect: boolean;

    constructor(
        private onConnect: OnConnectSignature<V>,
        { autoConnect = true }: ObservableConfig = {}
    ) {
        this.next = this.next.bind(this);
        this.error = this.error.bind(this);
        this.complete = this.complete.bind(this);
        this.autoConnect = autoConnect;
    }

    public subscribe(
        onNext: Next<V>,
        onError: ErrorSignature,
        onComplete: Complete = () => {}
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

    public unsubscribe(onNext?: Next<V>) {
        if (onNext) {
            this.listeners = this.listeners.filter((listener: Listener<V>) =>
                listener[0] !== onNext);
        } else {
            this.listeners = [];
        }

        return this;
    }

    public async connect() {
        if (!this.connected) {
            try {
                await this.onConnect(this.next, this.error, this.complete);
            } catch (e) {
                this.error(e);
            }
            this.connected = true;
        }
        return this;
    }

    private next(value: V, aditional?: any) {
        for (let i = 0, l = this.listeners.length; i < l; i++) {
            this.listeners[i][0](value, aditional);
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
