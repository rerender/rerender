// FIXME: move to separate lib
import { Map } from './types';

const UPPER_CASE = /[A-Z]|(^ms)/g;

export function convertJsProp(property: string) {
    return property.replace(UPPER_CASE, convertUpper);
}

function convertUpper(match: string) {
    return '-' + match.toLowerCase();
}

export function concatStyle(styles: Map<any>) {
    let styleString = '';

    if (typeof styles === 'object' && styles !== null) {
        styleString = '';

        for (const name in styles) {
            if (styles[name] !== undefined) {
                let nextName: string | undefined;
                if (UPPER_CASE.test(name)) {
                    nextName = convertJsProp(name);
                    if (styles[nextName] !== undefined) {
                        break;
                    }
                }
                styleString += `${nextName || name}:${styles[name]};`;
            }
        }
    }

    return styleString;
}
