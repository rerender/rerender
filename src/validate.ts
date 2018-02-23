const tagRegexp = /^[a-zA-Z0-9:]+$/;
const attrRegexp = /^[a-zA-Z0-9:\-]+$/;
export function isValidTag(tag: string) {
    return tagRegexp.test(tag);
}

export function isValidAttr(name: string) {
    return attrRegexp.test(name);
}
