import { TEMPLATE, VCOMPONENT } from './types';
import { styleProps } from './constants';
import { isPromise } from './Promise';

const REGEXP_ATTR = /[<>"&]/;
const REGEXP_HTML = /[<>&]/;

function escapeHtmlHeavy(value) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

const UPPER_CASE = /[A-Z]/g;

function convertStyleKey(key) {
    return styleProps[key] || convertStyleKeyHeavy(key);
}

function convertStyleKeyHeavy(key) {
    return String(key).replace(UPPER_CASE, convertUpper);
}

function convertUpper(match) {
    return '-' + match.toLowerCase();
}

function escapeStyle(value) {
    let styleString;

    if (typeof value === 'object' && value !== null) {
        styleString = '';

        for (var prop in value) {
            styleString += `${convertStyleKey(prop)}: ${value[prop]};`;
        }
    } else {
        styleString = value;
    }

    return escapeAttr(styleString);
}

function escapeHtml(value) {
    const string = String(value);

    if (string.length > 10) {
        return REGEXP_HTML.test(string) ? escapeHtmlHeavy(string) : string;
    } else {
        for (var i = 0, l = string.length; i < l; i++) {
            var char = string[i];
            if (char === '<' || char === '>' || char === '&') {
                return escapeHtmlHeavy(string);
            }
        }
    }

    return string;
}

function escapeAttrHeavy(value) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function escapeAttr(value) {
    const string = String(value);

    if (string.length > 10) {
        return REGEXP_ATTR.test(string) ? escapeAttrHeavy(string) : string;
    } else {
        for (var i = 0, l = string.length; i < l; i++) {
            var char = string[i];
            if (char === '<' || char === '>' || char === '"' || char === '&') {
                return escapeAttrHeavy(string);
            }
        }
    }

    return string;
}

const directEqual = {
    'number': true,
    'string': true,
    'boolean': true,
    'function': true,
    'undefined': true
};

function deepEqual(obj1, obj2) {
    if (obj1 === obj2) {
        return true;
    } else if (typeof obj1 !== typeof obj2) {
        return false;
    } else if (directEqual[typeof obj1] || obj1 === null) {
        return obj1 === obj2;
    } else if (Array.isArray(obj1)) {
        if (!Array.isArray(obj2) || obj1.length !== obj2.length) {
            return false;
        }

        for (let i = 0, l = obj1.length; i < l; i++) {
            const equal = deepEqual(obj1[i], obj2[i]);

            if (!equal) {
                return false;
            }
        }
    } else if (typeof obj1 === 'object') {
        if (typeof obj2 !== 'object') {
            return false;
        }
        const keys1 = Object.keys(obj1);
        const keys2 = Object.keys(obj2);

        if (keys1.length !== keys2.length) {
            return false;
        }

        for (let i = 0, l = keys1.length; i < l; i++) {
            const equal = deepEqual(obj1[keys1[i]], obj2[keys1[i]]);

            if (!equal) {
                return false;
            }
        }
    }

    return true;
}

function shallowEqual(obj1, obj2) {
    if (obj1 === obj2) {
        return true;
    } else if (obj1 === null || obj2 === null
        || typeof obj1 !== 'object' || typeof obj2 !== 'object') {
        return false;
    } else if (Object.keys(obj1).length !== Object.keys(obj2).length) {
        return false;
    }

    for (let name in obj1) {
        if (obj1[name] !== obj2[name]) {
            return false;
        }
    }

    return true;
}

function shallowEqualProps(props1, props2) {
    if (props1 === props2) {
        return true;
    } else if (props1 === null || props2 === null) {
        return false;
    } else if (Object.keys(props1).length !== Object.keys(props2).length) {
        return false;
    }

    for (let name in props1) {
        if (!isEqualValues(props1[name], props2[name])) {
            return false;
        }
    }

    return true;
}

function isEqualValues(value1, value2) {
    if (value1 === value2) {
        return true;
    }

    if (typeof value1 !== 'object' || value1 === null || value2 === null) {
        return false;
    }

    if (isEqualFragments(value1, value2) || (value1.type === TEMPLATE && value1.isEqual(value2))) {
        return true;
    }

    return false;
}

function isEqualFragments(arr1, arr2) {
    if (!Array.isArray(arr1) || !Array.isArray(arr2) || arr1.length !== arr2.length) {
        return false;
    }

    for (let i = 0, l = arr1.length; i < l; i++) {
        if (!isEqualValues(arr1[i], arr2[i])) {
            return false;
        }
    }

    return true;
}

function shallowEqualArray(array1, array2) {
    if (array1 === array2) {
        return true;
    }

    if (array1.length !== array2.length) {
        return false;
    }

    for (let i = 0, l = array1.length; i < l; i++) {
        if (array1[i] !== array2[i]) {
            return false;
        }
    }

    return true;
}

// FIXME: optimize
function calcHash(hash) {
    for (let j = 1, argsLength = arguments.length; j < argsLength; j++) {
        const word = arguments[j];
        if (typeof word !== 'string' || word.length === 0) return hash;

        for (let i = 0, l = word.length; i < l; i++) {
            hash  = (((hash << 5) - hash) + word.charCodeAt(i)) | 0;
        }
    }

    return hash;
}

function groupByIdNodes(node, memo) {
    // TODO: take id from context
    memo[node.context.getId()] = node;

    if (node.childNodes) {
        for (let i = 0, l = node.childNodes.length; i < l; i++) {
            groupByIdNodes(node.childNodes[i], memo);
        }
    }

    return memo;
}

function groupByIdComponents(component, memo) {
    if (component.type === VCOMPONENT) {
        memo[component.id] = component;
    }

    if (component.childs) {
        for (let i = 0, l = component.childs.length; i < l; i++) {
            groupByIdComponents(component.childs[i], memo);
        }
    }

    return memo;
}

function shallowClone(obj) {
    return Array.isArray(obj)
        ? obj.map(item => item)
        : Object.keys(obj).reduce((memo, name) => {
            memo[name] = obj[name];

            return memo;
        }, {});
}

function memoizeLast(fn, equalityFunctions = [], initialValues, initialResult) {
    let lastResult = initialResult;
    let lastArgs = initialValues;

    return function() {
        let args;

        if (lastArgs) {
            let same = true;
            args = [];

            for (let i = 0, l = arguments.length; i < l; i++) {
                if (arguments[i] === lastArgs[i] || (typeof equalityFunctions[i] === 'function' && equalityFunctions[i](arguments[i], lastArgs[i]))) {
                    args.push(lastArgs[i]);
                } else {
                    same = false;
                    args.push(arguments[i]);
                }
            }

            if (same && args.length === lastArgs.length) {
                return lastResult;
            }
        } else {
            args = arguments;
        }

        lastArgs = args;
        lastResult = fn(...args);

        return lastResult;
    };
}

function mayAsync(result, callback, errorCallback) {
    return isPromise(result)
        ? result.then(callback).catch(errorCallback)
        : callback(result);
}

export {
    mayAsync,
    calcHash,
    escapeAttr,
    escapeHtml,
    escapeStyle,
    groupByIdNodes,
    groupByIdComponents,
    memoizeLast,
    shallowClone,
    deepEqual,
    shallowEqual,
    shallowEqualProps,
    shallowEqualArray
};
