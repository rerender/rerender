const REGEXP_HTML = /[<>&]/;

export function escapeHtml(value: string) {
    return REGEXP_HTML.test(value)
        ? value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
        : value;
}
