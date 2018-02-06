export class VEvent {
    constructor(name, payload) {
        this.name = name;
        this.payload = payload;
        this.stopped = false;
    }

    stopPropagation() {
        this.stopped = true;
    }

    isStopped() {
        return this.stopped;
    }
}
