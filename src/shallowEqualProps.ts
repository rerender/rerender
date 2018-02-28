import { Map } from './types';

// FIXME: need implementation
export function shallowEqualProps(
    props: Map<any> | null | undefined,
    nextProps: Map<any> | null | undefined
) {
    return props === nextProps;
}
