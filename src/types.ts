import { Template } from './Template';
import { Store } from './Store';
import { TemplateFragment } from './TemplateFragment';
import { Component } from './Component';

export interface Map<T> {
    [key: string]: T;
}

export interface StatelessComponent<Props extends {
    [prop: string]: any,
    children?: PropsChildren
}, PropsChildren = Children> {
    // FIXME: must be Renderable, not any
    (props: Props): any;
    displayName?: string;
}

export interface ComponentClass<C extends Component<Props, State, Defaults>, Props = any, State = any, Defaults = any> {
    wrapper?: boolean;
    displayName?: string;
    store?: boolean;
    defaultProps?: Defaults;
    new(...args: any[]): C;
}

export type WrapperClass<C extends Component<Props, State, Defaults>, Props = any, State = any, Defaults = any> = {
    wrapper: true
} & ComponentClass<C>;

export type Controller = (Wrapped: ComponentClass<any>) => WrapperClass<any>;

export type ComponentType = string | ComponentClass<any> | StatelessComponent<any>;

export type Renderable =
    string |
    number |
    boolean |
    void |
    undefined |
    null |
    Template |
    TemplateFragment |
    RenderableArray;

export interface RenderableArray extends Array<Renderable> {}

export type Children = Renderable | RenderableArray;

export type Path = Array<string | number>;

export type Reducer = (getState: Store<any>['getState'], setState: Store<any>['setState'], payload: any) => void;
export type RerenderEvent = {
    name: string,
    get?: (state: any, payload: any) => any,
    effect?: (state: any, payload: any) => any,
    reducers?: Reducer[],
    cachePeriod?: number,
    crossUserCache?: boolean
};

export type Dispatch = (event: RerenderEvent, payload: any) => Promise<any>;

export type Key = string | number;

declare global {
    namespace JSX {
        interface Element extends Template {}

        interface IntrinsicAttributes {
            controller?: Controller | Controller[];
            uniqid?: Key;
            key?: Key;
            ref?: (ref: HTMLElement | Component<any>) => any;
            wrapperRef?: (ref: ComponentClass<any>) => any;
            [prop: string]: any; // Enable any props for elements with controller property
        }

        interface IntrinsicElements {
            [key: string]: any;
        }

        interface ElementAttributesProperty {
            $externalProps: {};
        }

        interface ElementChildrenAttribute {
            children: {};  // specify children name to use
        }
    }
}
