import { Template } from './Template';
import { TemplateFragment } from './TemplateFragment';
import { Component } from './Component';

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

export type ComponentType = string | ComponentClass<any> | StatelessComponent<any, any>;

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
