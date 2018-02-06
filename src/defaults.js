import { escapeAttr, escapeHtml } from './utils';

export const eventDefaults = {
    cache: false,
    single: false,
    crossUser: false,
    serverDisabled: false,
    serverCacheAge: 600000
};

export const getWrapHeader = ({
    title,
    head,
    applicationId
}) => `<!DOCTYPE html>
<html>
<head>
    <title>${escapeHtml(title)}</title>
    ${head}
</head>
<body id="${escapeAttr(applicationId)}">`;

export const getWrapFooter = ({
    bodyEnd
}) => `${bodyEnd}
</body>
</html>`;

export const defaultApplicationId = 'rerenderApplication';

export const getApplicationAfter = ({
    dispatcherCache,
    applicationId = defaultApplicationId,
    hashEnabled,
    eventDefaults = {},
    hash,
    fullHash
}) => `<script>
    window.__RERENDER__${applicationId} = {};
    window.__RERENDER__${applicationId}.dispatcherCache = ${JSON.stringify(dispatcherCache)};
    window.__RERENDER__${applicationId}.eventDefaults = ${JSON.stringify(eventDefaults)};
    window.__RERENDER__${applicationId}.settings = ${JSON.stringify({
        hashEnabled,
        fullHash,
        hash
    })};
</script>`;
