/* eslint-disable no-console */
let mesuarements = {};

function performanceStart(type) {
    if (typeof performance === 'undefined') {
        return;
    }

    mesuarements[type] = performance.now();
}

function performanceEnd(type) {
    if (typeof performance === 'undefined') {
        return;
    }

    debug.log(`${type} took ${(performance.now() - mesuarements[type]).toFixed(3)}ms`);
}

const debug = {
    log() {
        console.log.apply(console, arguments);
    },
    warn() {
        console.warn.apply(console, arguments);
    },
    error() {
        console.error.apply(console, arguments);
    }
};

export {
    debug,
    performanceStart,
    performanceEnd
};
