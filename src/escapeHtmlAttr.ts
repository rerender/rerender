const REGEXP_ATTR = /[<>"&]/;

export function escapeHtmlAttr(value: string) {
    return REGEXP_ATTR.test(value)
        ? value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
        : value;
}
