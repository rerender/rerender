import { Map, Renderable } from './types';
import { intrinsicProps } from './constants';

export function getComponentProps(
    props: Map<any> | null | undefined,
    children: Renderable[] | undefined,
    defaultProps?: Map<any>,
    intrinsic: Map<any> = intrinsicProps
): Map<any> {
    const componentProps: Map<any> = Object.keys(props || {})
        .reduce((memo: Map<any>, key) => {
            if (!intrinsic[key]) {
                memo[key] = (props as Map<any>)[key];
            }

            return memo;
        }, {});

    if (Array.isArray(children)) {
        if (children.length > 1) {
            componentProps.children = children;
        } else {
            componentProps.children = children[0];
        }
    } else {
        componentProps.children = children;
    }

    if (defaultProps) {
        for (const name in defaultProps) {
            if (componentProps[name] === undefined) {
                componentProps[name] = defaultProps[name];
            }
        }
    }

    return componentProps;
}
