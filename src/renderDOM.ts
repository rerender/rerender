import { ComponentClass, Map, Renderable, RenderDOMConfig, StatelessComponent } from './types';
import { shallowEqualProps } from './shallowEqualProps';
import { Component } from './Component';
import { Channel } from './Channel';
import { Observable } from './Observable';
import { Template } from './Template';
import { TemplateFragment } from './TemplateFragment';

type DOMNode = HTMLElement | Document;

type MovableNode = {
    domNode: HTMLElement,
    template: Template<string>
};

type ComponentNode = {
    component: Component<any>,
    parentComponent?: Component<any>,
    template?: Template, // only for moveable
    props: any,
    state?: any,
    tree: Renderable
};

type MapNodes = Map<DOMNode | MovableNode | ComponentNode>;

type Patch = PatchCreate | PatchMove | PatchRemove | PatchUpdate;

type PatchCreate = {
    type: 'create',
    parentDomNode: DOMNode,
    tryReuseDOM?: boolean,
    domIndex: number,
    domNode: HTMLElement | DocumentFragment
    changedNodes: MapNodes
};

type PatchMove = {
    type: 'move',
    parentDomNode: DOMNode,
    domIndex: number,
    domNodes: [HTMLElement],
    changedNodes: MapNodes
};

type PatchRemove = {
    type: 'remove',
    domNodes: [HTMLElement]
    removedNodes: Map<boolean>,
    templateForRemove: Renderable
};

type PatchUpdate = {
    type: 'update',
    domNode: HTMLElement,
    setProps: Map<any>,
    removeProps: Map<true>,
    changedNodes: MapNodes
};

type Context = {
    id: string,
    parentDomNode: DOMNode,
    parentComponent?: Component<any>,
    nextDomIndex: number,
    insidePatchType?: 'create' | 'move' | 'remove',
    insidePatchWithReplace?: boolean
};

type Next = (patch: Patch) => any;

function render(
    nextTemplate: Renderable,
    prevTemplate: Renderable,
    context: Context,
    nodesById: MapNodes,
    next: Next
) {
    // if (nextTemplate != null) {
        // if (prevTemplate == null) {
            // if (isMovable(nextTemplate) && isSameType(template, prevTemplateById)) {
                // move
            // } else {
                // create
            // }
        // } else {
            // if (!isSameType(template, prevTemplate)) {
                // if (isMovable(nextTemplate) && isSameType(template, prevTemplateById)) {
                    // move and replace
                // } else {
                    // replace
                // }
            // }
        // }
        // patch deeper here
    // } else {
        // if (prevTemplate != null) {
            // remove prev and meta
        // }
    // }

    if (typeof nextTemplate === 'object') {
        if (nextTemplate instanceof Template) {
            if (typeof nextTemplate.componentType === 'string') {
                // renderElement(nextTemplate, prevTemplate, context, nodesById);
            } else if (nextTemplate.componentType.prototype instanceof Component) {
                // renderComponent(nextTemplate, prevTemplate, context, nodesById);
            } else if ((nextTemplate.componentType as StatelessComponent<any>).$uberComponent) {
                // renderUber(nextTemplate, prevTemplate, context, nodesById);
            } else {
                // renderStateless(nextTemplate, prevTemplate, context, nodesById);
            }
        } else if (nextTemplate instanceof TemplateFragment) {
            if (Array.isArray(nextTemplate.children)) {
                // renderArray(nextTemplate, prevTemplate, context, nodesById);
            } else {
                // render(nextTemplate, prevTemplate, context, nodesById);
            }
        } else if (Array.isArray(nextTemplate)) {
            // renderArray(nextTemplate, prevTemplate, context, nodesById);
        } else if (nextTemplate === null) {
            renderNothing(prevTemplate, context, nodesById, next);
        } else {
            throw new Error(
                'Objects are not valid as Rerender child ' +
                `(found: object ${JSON.stringify(nextTemplate)}). ` +
                'If you meant to render a collection of children, use an array instead.'
            );
        }
    } else if (typeof nextTemplate === 'string') {
        // renderString(nextTemplate, prevTemplate, context, nodesById);
    } else if (typeof nextTemplate === 'number') {
        // renderNumber(nextTemplate, prevTemplate, context, nodesById);
    } else {
        renderNothing(prevTemplate, context, nodesById, next);
    }
}

function renderNothing(
    prevTemplate: Renderable,
    context: Context,
    nodesById: MapNodes,
    next: Next
) {
    if (prevTemplate != null && typeof prevTemplate !== 'boolean') {
        // remove prev component or nodes
    }
}

const enabledKeysTypes: Map<boolean> = {
    string: true,
    number: true
};

function isMovable(template: Renderable) {
    return template instanceof Template && template.props != null &&
        (enabledKeysTypes[typeof template.props.uniqid] || enabledKeysTypes[typeof template.props.uniqid]);
}
