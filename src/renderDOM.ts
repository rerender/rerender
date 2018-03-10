import {
    ComponentClass,
    DOMContext,
    DOMNode,
    Dispatch,
    Map,
    ComponentNode,
    Patch,
    PatchCreate,
    PatchContext,
    Renderable,
    RenderDOMOptions,
    RenderDOMConfig,
    StatelessComponent
} from './types';
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
    const patchContext = {
        id: getId(template, 'r', 0, false),
        parentDomNode: domNode
    };
    const domContext = {
        nextDomIndex: 0
    };
    const patches: Patch[] = [];
    const templatesById: Map<Template> = {};
    const domNodesById: Map<DOMNode> = {};
    const componentsById: Map<ComponentNode> = {};

    const options: RenderDOMOptions = {
        channel,
        dispatcher: {
            dispatch: noop
        },
        document: window.document,
        templatesById,
        domNodesById,
        componentsById
    };

    renderTree(template, undefined, domContext, patchContext, options)
        .subscribe(
            (patch: Patch | Patch[]) => Array.isArray(patch)
                ? patches.push(...patch)
                : patches.push(patch),
            (error: Error) => { throw error; },
            () => applyPatches(patches, options)
        );
}

function renderTree(
    nextTemplate: Renderable,
    prevTemplate: Renderable,
    domContext: DOMContext,
    patchContext: PatchContext,
    options: RenderDOMOptions
) {
    return new Observable<Patch>((next, error, complete) => {
        render(nextTemplate, prevTemplate, domContext, patchContext, options, next, error);
        complete();
    });
}

function render(
    nextTemplate: Renderable,
    prevTemplate: Renderable,
    domContext: DOMContext,
    patchContext: PatchContext,
    options: RenderDOMOptions,
    next: Next,
    error: ErrorSignature
) {
    switch (patchContext.currentPatch && patchContext.currentPatch.type) {
        case 'create':
            if (!isNothing(nextTemplate) &&
                isMovable(nextTemplate) && isSameType(nextTemplate, options.templatesById[patchContext.id])) {

                // move
            }
            break;

        case undefined:
            if (!isSameType(nextTemplate, prevTemplate)) {
                // remove prev
                if (!isNothing(nextTemplate)) {
                    if (isMovable(nextTemplate) && isSameType(nextTemplate, options.templatesById[patchContext.id])) {
                        // move
                    } else {
                        const nextParentDomNode = options.document.createDocumentFragment();

                        const patch: Patch = {
                            type: 'create',
                            parentDomNode: patchContext.parentDomNode as HTMLElement,
                            domIndex: domContext.nextDomIndex,
                            domNode: nextParentDomNode,
                            templatesById: {},
                            domNodesById: {},
                            componentsById: {}
                        };
                        next(patch);
                        patchContext = {
                            ...patchContext,
                            parentDomNode: nextParentDomNode,
                            currentPatch: patch
                        };
                    }
                }
            }
            break;
    }

    if (typeof nextTemplate === 'object') {
        if (nextTemplate instanceof Template) {
            if (typeof nextTemplate.componentType === 'string') {
                renderElement(nextTemplate, prevTemplate, domContext, patchContext, options, next, error);
            } else if (nextTemplate.componentType.prototype instanceof Component) {
                renderComponent(nextTemplate, prevTemplate, domContext, patchContext, options, next, error);
            } else if ((nextTemplate.componentType as StatelessComponent<any>).$uberComponent) {
                // renderUber(nextTemplate, prevTemplate, context, nodesById);
            } else {
                // renderStateless(nextTemplate, prevTemplate, context, nodesById);
            }
        } else if (nextTemplate instanceof TemplateFragment) {
            if (Array.isArray(nextTemplate.children)) {
                renderArray(
                    nextTemplate.children,
                    prevTemplate && (prevTemplate as any).children,
                    domContext,
                    patchContext,
                    options,
                    next,
                    error,
                    true
                );
            } else {
                render(
                    nextTemplate.children,
                    prevTemplate && (prevTemplate as any).children,
                    domContext,
                    patchContext,
                    options,
                    next,
                    error
                );
            }
        } else if (Array.isArray(nextTemplate)) {
            renderArray(nextTemplate, prevTemplate, domContext, patchContext, options, next, error);
        } else if (nextTemplate !== null) {
            error(new Error(
                'Objects are not valid as Rerender child ' +
                `(found: object ${JSON.stringify(nextTemplate)}). ` +
                'If you meant to render a collection of children, use an array instead.'
            ));
            return;
        }
    } else if (typeof nextTemplate === 'string') {
        renderString(nextTemplate, prevTemplate, domContext, patchContext, options, next, error);
    } else if (typeof nextTemplate === 'number') {
        renderString(String(nextTemplate), prevTemplate, domContext, patchContext, options, next, error);
    }
}

function renderComponent(
    nextTemplate: Template<ComponentClass>,
    prevTemplate: Renderable,
    domContext: DOMContext,
    patchContext: PatchContext,
    options: RenderDOMOptions,
    next: Next,
    error: ErrorSignature
) {
    const componentType = nextTemplate.componentType;
    const props = getComponentProps(
        nextTemplate.props,
        nextTemplate.children,
        componentType.defaultProps,
        componentType.wrapper ? intrinsicPropsWrapper : intrinsicProps
    );

    switch (patchContext.currentPatch && patchContext.currentPatch.type) {
        case 'create': {
            const instance = new componentType(props, options.dispatcher.dispatch);
            const nextPatchContext = {
                ...patchContext,
                parentComponent: instance,
                id: patchContext.id + '.0'
            };
            if (typeof instance.componentDidCatch === 'function') {
                const componentTemplate = instance.render();
                const patches: Patch[] = [];
                renderTree(componentTemplate, undefined, domContext, nextPatchContext, options)
                    .subscribe(
                        (patch: Patch | Patch[]) => Array.isArray(patch)
                            ? patches.push(...patch)
                            : patches.push(patch),
                        (e: Error) => {
                            (instance.componentDidCatch as Function)(e);
                            render(instance.render(), undefined, domContext, nextPatchContext, options, next, error);
                        },
                        () => next(patches)
                    );
            } else {
                render(instance.render(), undefined, domContext, nextPatchContext, options, next, error);
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

function renderElement(
    nextTemplate: Template<string>,
    prevTemplate: Renderable,
    domContext: DOMContext,
    patchContext: PatchContext,
    options: RenderDOMOptions,
    next: Next,
    error: ErrorSignature
) {
    if (!isValidTag(nextTemplate.componentType)) {
        error(new Error(`Name of tag  "${nextTemplate.componentType}" is not valid`));
        return;
    }

    switch (patchContext.currentPatch && patchContext.currentPatch.type) {
        case 'create': {
            const nextDomNode = options.document.createElement(nextTemplate.componentType);
            if (nextTemplate.props) {
                setAttrs(nextDomNode, nextTemplate.props, error);
            }
            patchContext.parentDomNode.appendChild(nextDomNode);
            domContext.nextDomIndex++;
            (patchContext.currentPatch as PatchCreate).domNodesById[patchContext.id] = nextDomNode;
            if (nextTemplate.children) {
                renderArray(
                    nextTemplate.children,
                    undefined,
                    { nextDomIndex: 0 },
                    {
                        ...patchContext,
                        parentDomNode: nextDomNode,
                    },
                    options,
                    next,
                    error,
                    true
                );
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

function renderString(
    nextTemplate: string,
    prevTemplate: Renderable,
    domContext: DOMContext,
    patchContext: PatchContext,
    options: RenderDOMOptions,
    next: Next,
    error: ErrorSignature
) {
    switch (patchContext.currentPatch && patchContext.currentPatch.type) {
        case 'create': {
            const nextDomNode = options.document.createTextNode(nextTemplate);
            patchContext.parentDomNode.appendChild(nextDomNode);
            domContext.nextDomIndex++;
            (patchContext.currentPatch as PatchCreate).domNodesById[patchContext.id] = nextDomNode;
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
    domContext: DOMContext,
    patchContext: PatchContext,
    options: RenderDOMOptions,
    next: Next,
    error: ErrorSignature,
    noNeedKeys?: boolean
) {
    const isPrevArray = Array.isArray(prevTemplate);

    for (let i = 0, l = nextTemplate.length; i < l; i++) {
        render(
            nextTemplate[i],
            isPrevArray ? (prevTemplate as Renderable[])[i] : undefined,
            domContext,
            {
                ...patchContext,
                id: getId(nextTemplate[i], patchContext.id, i, !noNeedKeys)
            },
            options,
            next,
            error
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

function getId(template: Renderable, parentId: string, index: number, needKey: boolean): string {
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
