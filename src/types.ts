import { Template } from './Template';
import { Component } from './Component';
import { Fragment } from './Fragment';

export interface Map<T> {
    [key: string]: T;
}

export interface StatelessComponent<Props, Defaults extends Partial<Props> = {}> {
    (props: Props & Defaults, children: Children): Renderable;
    displayName?: string;
}

export interface ComponentClass<C extends Component<any>> {
    wrapper?: boolean;
    displayName?: string;
    store?: boolean;
    defaultProps?: Map<any>;
    new(...args: any[]): C;
}

export type ComponentType = string | ComponentClass<any> | StatelessComponent<any, any> | typeof Fragment;

export type Renderable =
    string |
    number |
    boolean |
    void |
    undefined |
    null |
    Template |
    RenderableArray;

export interface RenderableArray extends Array<Renderable> {}

export type Children = Renderable | RenderableArray;
