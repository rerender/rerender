import {
    ComponentClass,
    DOMNode,
    Dispatch,
    Map,
    ComponentNode,
    Patch,
    PatchCreate,
    Renderable,
    RenderDOMOptions as Options,
    RenderDOMConfig,
    StatelessComponent
} from './types';
import { Context } from './Context';
import { disabledAttrs, mapJsAttrs, intrinsicProps, intrinsicPropsWrapper } from './constants';
import { applyPatches } from './applyPatches';
import { noop } from './noop';
import { shallowEqualProps } from './shallowEqualProps';
import { Component } from './Component';
import { Channel } from './Channel';
import { Observable } from './Observable';
import { Template } from './Template';
import { TemplateFragment } from './TemplateFragment';
import { getComponentProps } from './getComponentProps';
import { isValidTag, isValidAttr } from './validate';

type Next = (patch: Patch | Patch[]) => any;
type ErrorSignature = (error: Error) => any;

export function renderDOM(
    template: Renderable,
    { window, domNode = window.document }: RenderDOMConfig = {}
) {
    const channel = new Channel();
    const context = new Context(
        getId(template, 'r', 0, false),
        domNode,
        { index: 0 }
    );
    const patches: Patch[] = [];
    const templatesById: Map<Template> = {};
    const domNodesById: Map<DOMNode> = {};
    const componentsById: Map<ComponentNode> = {};

    const options: Options = {
        channel,
        dispatcher: {
            dispatch: noop
        },
        document: window.document,
        templatesById,
        domNodesById,
        componentsById
    };

    renderTree(template, undefined, context, options)
        .subscribe(
            (patch: Patch | Patch[]) => Array.isArray(patch)
                ? patches.push(...patch)
                : patches.push(patch),
            (error: Error) => { throw error; },
            () => applyPatches(patches, options)
        );
}

function renderTree(nextTemplate: Renderable, prevTemplate: Renderable, context: Context, options: Options) {
    return new Observable<Patch>((next, error, complete) => {
        render(nextTemplate, prevTemplate, context.cloneBy({ next, error }), options);
        complete();
    });
}

function render(nextTemplate: Renderable, prevTemplate: Renderable, context: Context, options: Options) {
    switch (context.currentPatch && context.currentPatch.type) {
        case 'create':
            if (!isNothing(nextTemplate) &&
                isMovable(nextTemplate) && isSameType(nextTemplate, options.templatesById[context.id])) {

                // move
            }
            break;

        case undefined:
            if (!isSameType(nextTemplate, prevTemplate)) {
                // remove prev
                if (!isNothing(nextTemplate)) {
                    if (isMovable(nextTemplate) && isSameType(nextTemplate, options.templatesById[context.id])) {
                        // move
                    } else {
                        const nextParentDomNode = options.document.createDocumentFragment();

                        const patch: Patch = {
                            type: 'create',
                            parentDomNode: context.parentDomNode as HTMLElement,
                            domIndex: context.nextDomIndex.index,
                            domNode: nextParentDomNode,
                            templatesById: {},
                            domNodesById: {},
                            componentsById: {}
                        };
                        context.next(patch);
                        context = context.cloneBy({
                            parentDomNode: nextParentDomNode,
                            currentPatch: patch
                        });
                    }
                }
            }
            break;
    }

    if (typeof nextTemplate === 'object') {
        if (nextTemplate instanceof Template) {
            if (typeof nextTemplate.componentType === 'string') {
                renderElement(nextTemplate, prevTemplate, context, options);
            } else if (nextTemplate.componentType.prototype instanceof Component) {
                renderComponent(nextTemplate, prevTemplate, context, options);
            } else if ((nextTemplate.componentType as StatelessComponent<any>).$uberComponent) {
                // renderUber(nextTemplate, prevTemplate, context, nodesById);
            } else {
                // renderStateless(nextTemplate, prevTemplate, context, nodesById);
            }
        } else if (nextTemplate instanceof TemplateFragment) {
            if (Array.isArray(nextTemplate.children)) {
                const prevChildren = prevTemplate && (prevTemplate as any).children;
                renderArray(nextTemplate.children, prevChildren, context, options);
            } else {
                const prevChildren = prevTemplate && (prevTemplate as any).children;
                render(nextTemplate.children, prevChildren, context, options);
            }
        } else if (Array.isArray(nextTemplate)) {
            renderArray(nextTemplate, prevTemplate, context, options, true);
        } else if (nextTemplate === null) {
            renderString('', prevTemplate, context, options);
        } else {
            context.error(new Error(
                'Objects are not valid as Rerender child ' +
                `(found: object ${JSON.stringify(nextTemplate)}). ` +
                'If you meant to render a collection of children, use an array instead.'
            ));
            return;
        }
    } else if (typeof nextTemplate === 'string') {
        renderString(nextTemplate, prevTemplate, context, options);
    } else if (typeof nextTemplate === 'number') {
        renderString(String(nextTemplate), prevTemplate, context, options);
    } else if (isNothing(nextTemplate)) {
        renderString('', prevTemplate, context, options);
    }
}

function renderComponent(
    nextTemplate: Template<ComponentClass>,
    prevTemplate: Renderable,
    context: Context,
    options: Options
) {
    const componentType = nextTemplate.componentType;
    const props = getComponentProps(
        nextTemplate.props,
        nextTemplate.children,
        componentType.defaultProps,
        componentType.wrapper ? intrinsicPropsWrapper : intrinsicProps
    );

    switch (context.currentPatch && context.currentPatch.type) {
        case 'create': {
            const instance = new componentType(props, options.dispatcher.dispatch);
            if (typeof instance.componentDidCatch === 'function') {
                const componentTemplate = instance.render();
                const patches: Patch[] = [];
                renderTree(componentTemplate, undefined, context.cloneBy({
                    id: getId(componentTemplate, context.id, 0, true),
                    parentComponent: instance,
                    currentPatch: undefined
                }), options)
                    .subscribe(
                        (patch: Patch | Patch[]) => Array.isArray(patch)
                            ? patches.push(...patch)
                            : patches.push(patch),
                        (e: Error) => {
                            (instance.componentDidCatch as Function)(e);
                            const template = instance.render();
                            render(template, undefined, context.cloneBy({
                                id: getId(template, context.id, 0, true),
                                parentComponent: instance,
                            }), options);
                        },
                        () => context.next(patches)
                    );
            } else {
                const componentTemplate = instance.render();
                render(instance.render(), undefined, context.cloneBy({
                    id: getId(componentTemplate, context.id, 0, true),
                    parentComponent: instance,
                }), options);
            }
            break;
        }
        case 'move': {
            break;
        }
        case undefined: {
            break;
        }
    }

}

function renderElement(nextTemplate: Template<string>, prevTemplate: Renderable, context: Context, options: Options) {
    if (!isValidTag(nextTemplate.componentType)) {
        context.error(new Error(`Name of tag  "${nextTemplate.componentType}" is not valid`));
        return;
    }

    switch (context.currentPatch && context.currentPatch.type) {
        case 'create': {
            const nextDomNode = options.document.createElement(nextTemplate.componentType);
            if (nextTemplate.props) {
                setAttrs(nextDomNode, nextTemplate.props, context.error);
            }
            context.parentDomNode.appendChild(nextDomNode);
            context.incrementDom();
            (context.currentPatch as PatchCreate).domNodesById[context.id] = nextDomNode;
            if (nextTemplate.children) {
                renderArray(nextTemplate.children, undefined, context.addDomLevel(nextDomNode), options);
            }
            break;
        }

        case 'move':
            // TODO move
        case undefined:
            // TODO update
            break;
    }
}

function setAttrs(domNode: HTMLElement, props: Map<any>, error: ErrorSignature) {
    for (const name in props) {
        if (!disabledAttrs[name]) {
            if (!isValidAttr(name)) {
                error(new Error(`attribute "${name}" is not valid`));
                return;
            }
            const jsName = mapJsAttrs[name];
            if (jsName) {
                (domNode as any)[jsName] = props[name];
            } else {
                domNode.setAttribute(name, props[name]);
            }
        }
    }
}

function renderString(nextTemplate: string, prevTemplate: Renderable, context: Context, options: Options) {
    switch (context.currentPatch && context.currentPatch.type) {
        case 'create': {
            const nextDomNode = options.document.createTextNode(nextTemplate);
            context.parentDomNode.appendChild(nextDomNode);
            context.incrementDom();
            (context.currentPatch as PatchCreate).domNodesById[context.id] = nextDomNode;
            break;
        }

        case 'move':
            // TODO move
        case undefined:
            // TODO update
            break;
    }
}

function renderArray(
    nextTemplate: Renderable[],
    prevTemplate: Renderable,
    context: Context,
    options: Options,
    needKeys?: boolean
) {
    const isPrevArray = Array.isArray(prevTemplate);

    for (let i = 0, l = nextTemplate.length; i < l; i++) {
        render(
            nextTemplate[i],
            isPrevArray ? (prevTemplate as Renderable[])[i] : undefined,
            context.cloneBy({
                id: getId(nextTemplate[i], context.id, i, needKeys)
            }),
            options
        );
    }
}

const noRenderTypes: Map<boolean> = {
    boolean: true,
    undefined: true,
    function: true
};

function isNothing(template: Renderable) {
    return template === null || noRenderTypes[typeof template];
}

function isSameType(template1: Renderable, template2: Renderable) {
    const type1 = typeof template1;
    const type2 = typeof template2;

    if (isNothing(template1) && isNothing(template2)) {
        return true;
    } else if (type1 === 'object' && type2 === 'object') {
        if (template1 instanceof Template) {
            return template2 instanceof Template && template1.componentType === template2.componentType;
        } else if (Array.isArray(template1)) {
            return Array.isArray(template2);
        } else if (template1 instanceof TemplateFragment) {
            return template2 instanceof TemplateFragment;
        }
    }

    return type1 === type2;
}

const enabledKeysTypes: Map<boolean> = {
    string: true,
    number: true
};

function isMovable(template: Renderable) {
    return template instanceof Template &&  template.props != null &&
        (enabledKeysTypes[typeof template.props.uniqid] || enabledKeysTypes[typeof template.props.uniqid]);
}

function getId(template: Renderable, parentId: string, index: number, needKey?: boolean): string {
    if (isMovable(template)) {
        const props = (template as any).props;
        if (props.uniqid !== undefined) {
            return 'u' + props.uniqid;
        } else {
            return parentId + '.k' + props.key;
        }
    } else {
        if (needKey && template instanceof Template) {
            console.warn('Each child in an array ' + // tslint:disable-line:no-console
                'should have a unique "key" or "uniqid" prop');
        }
        return parentId + '.' + index;
    }
}
