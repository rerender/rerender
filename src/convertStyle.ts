const UPPER_CASE = /[A-Z]/g;
// TODO: benchmark with ms
// const UPPER_CASE = /[A-Z]|(^ms)/g;

export function convertStyle(property: string) {
    return property.replace(UPPER_CASE, convertUpper);
}

function convertUpper(match: string) {
    return '-' + match.toLowerCase();
}
