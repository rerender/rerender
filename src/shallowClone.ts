export function shallowClone(obj: any[] | { [key: string]: any }): any {
    return Array.isArray(obj) ? [ ...obj ] : { ...obj };
}
