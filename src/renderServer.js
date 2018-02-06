import { getWrapHeader, getWrapFooter, getApplicationAfter, applicationId as defaultApplicationId } from './defaults';
import { Events } from './Events';
import { DispatcherFirstRender } from './DispatcherFirstRender';
import { Promise } from './Promise';
import { mayAsync } from './utils';

function renderServer(userTemplate, {
    applicationId = defaultApplicationId,
    wrap = false,
    title = '',
    head = '',
    bodyEnd = '',
    hashEnabled = true,
    eventDefaults,
    fullHash = false,
    onData,
    onError,
    onEnd
} = {}) {
    const stream = new Events();
    let needConcat = true;
    let promiseResolve;
    const promise = new Promise(resolve => {
        promiseResolve = resolve;
    });

    if (typeof onData === 'function') {
        stream.on('data', onData);
        needConcat = false;
    }
    if (typeof onError === 'function') {
        stream.on('error', onError);
        needConcat = false;
    }
    if (typeof onEnd === 'function') {
        stream.on('end', onEnd);
        stream.on('end', () => {
            stream.un('data');
            stream.un('error');
            promiseResolve();
        });
        needConcat = false;
    }

    if (needConcat) {
        let html = '';
        stream.on('data', data => {
            html += data;
        });
        stream.on('end', () => promiseResolve(html));
    }

    const dispatcher = new DispatcherFirstRender({ eventDefaults, isServer: true });

    if (wrap) {
        stream.emit('data', getWrapHeader({
            title,
            head,
            applicationId
        }));
    }

    const config = {
        store: dispatcher.store,
        dispatcher,
        hashEnabled,
        fullHash,
        stream,
        componentOptions: {
            dispatch: dispatcher.dispatch
        },
        hash: 0
    };

    mayAsync(userTemplate.renderServer(config), () => {
        if (wrap) {
            stream.emit('data', getApplicationAfter({
                applicationId,
                dispatcherCache: dispatcher.dehydrate(),
                hashEnabled,
                fullHash,
                eventDefaults,
                hash: config.hash
            }));

            stream.emit('data', getWrapFooter({
                bodyEnd
            }));
        }

        stream.emit('end');
    }, error => config.stream.emit('error', error));

    return promise;
}

export { renderServer };
