import { Template } from './Template';
import { Store } from './Store';
import { Channel } from './Channel';
import { TemplateFragment } from './TemplateFragment';
import { Component } from './Component';

export interface Map<T> {
    [key: string]: T;
}

export interface StatelessComponent<Props extends {
    [prop: string]: any,
    children?: PropsChildren
}, PropsChildren = Renderable> {
    // FIXME: must be Renderable, not any (now any for correct jsx support in typescript)
    (props: Props & { children?: PropsChildren }): any;
    displayName?: string;
    $uberComponent?: boolean;
}

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

export type Controller = (Wrapped: ComponentClass) => WrapperClass;

export interface ComponentClass<C extends Component<any> = Component<any>> {
    wrapper?: boolean;
    displayName?: string;
    store?: boolean;
    defaultProps?: any;
    new(...args: any[]): C;
}

export type WrapperClass<C extends Component<any> = Component<any>> = {
    wrapper: true
} & ComponentClass<C>;

export type ComponentType = string | ComponentClass<Component<any, any, any, any>> | StatelessComponent<any, any>;

export type Path = Array<string | number>;

export type Reducer<State = any, Payload = any> = (
    payload: Payload,
    options: { getState: Store<State>['getState'], setState: Store<State>['setState'] }
) => void;

export type RerenderEvent<State> = {
    name: string,
    get?: (payload: any, options: { state: State }) => any,
    effect?: (
        payload: any,
        options: {
            state: State,
            dispatch: Dispatch
        }
    ) => any,
    reducers?: Array<Reducer<State, any>>,
    cachePeriod?: number,
    crossUserCache?: boolean
};

export type RenderServerConfig = {
    iterations?: number,
    stream?: boolean,
    // FIXME: Dispatcher
    dispatcher?: {
        dispatch: Dispatch
    }
};

export type RenderDOMConfig = {
    domNode?: HTMLElement,
    win?: Window
};

// FIXME: Promise<any> not always Promise actually
export type Dispatch = (event: RerenderEvent<any>, payload: any) => Promise<any>;

export type Key = string | number;

export type DOMNode = HTMLElement | Document | Text;

export type ComponentNode = {
    props: any,
    render: Renderable,
    instance?: Component<any>,
    state?: any,
    parentComponent?: Component<any>
};

export type RenderDOMOptions = {
    channel: Channel,
    dispatcher: {
        dispatch: Dispatch
    },
    document: Document,
    templatesById: Map<Template>, // only movable
    domNodesById: Map<DOMNode>, // all DOM nodes
    componentsById: Map<ComponentNode> // all components with state and stateless
};

export type Patch = PatchCreate | PatchMove | PatchRemove | PatchUpdate;

export type PatchCreate = {
    type: 'create',
    id: string,
    parentDomNodeId: string,
    componentNode?: ComponentNode,
    isDocumentFragment?: boolean,
    template?: Renderable,
    replacedDomNodeId?: string,
    childrenPatches: Patch[],
    parentPatch?: Patch
};

export type PatchMove = {
    type: 'move',
    id: string,
    domNodes?: DOMNode[],
    parentDomNodeId: string,
    componentNode?: ComponentNode,
    template: Renderable,
    setProps?: Map<any>,
    removeProps?: Map<boolean>,
    replacedId?: string,
    childrenPatches: Patch[],
    parentPatch?: Patch
};

export type PatchRemove = {
    type: 'remove',
    id: string,
    template?: Renderable,
    childrenPatches: Patch[],
    parentPatch?: Patch
};

export type PatchUpdate = {
    type: 'update',
    id: string,
    setProps?: Map<any>,
    removeProps?: Map<boolean>,
    childrenPatches: Patch[],
    parentPatch?: Patch
};

declare global {
    namespace JSX {
        interface Element extends Template {}

        interface IntrinsicAttributes {
            controller?: Controller | Controller[];
            uniqid?: Key;
            key?: Key;
            ref?: (ref: HTMLElement | Component<any>) => any;
            wrapperRef?: (ref: ComponentClass<any>) => any;
            dangerousInnerHtml?: string;
            [prop: string]: any; // Enable any props for elements with controller property
        }

        interface IntrinsicElements {
            [key: string]: {
                [prop: string]: any;
                class?: string;
                className?: undefined;
                htmlFor?: undefined;
                maxLength?: undefined;
            };
        }

        interface ElementAttributesProperty {
            $externalProps: {};
        }

        interface ElementChildrenAttribute {
            children: {};  // specify children name to use
        }
    }
}
