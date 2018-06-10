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
import { intrinsicProps, intrinsicPropsWrapper } from './constants';
import { applyPatches } from './applyPatches';
import { Flush, Doctype } from './uberComponents';
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
    { win = window, domNode = win.document }: RenderDOMConfig = {}
) {
    const channel = new Channel();
    const context = new Context(
        getId(template, 'r', 0, false),
        'r'
    );
    const templatesById: Map<Template> = {};
    const domNodesById: Map<DOMNode> = {
        r: domNode
    };
    const componentsById: Map<ComponentNode> = {};

    const options: Options = {
        channel,
        dispatcher: {
            dispatch: noop
        },
        document: win.document,
        templatesById,
        domNodesById,
        componentsById
    };

    const patches: Patch[] = [];

    renderTree(template, undefined, context, options)
        .subscribe(
            (patch: Patch | Patch[]) => {
                if (Array.isArray(patch)) {
                    for (let i = 0, l = patch.length; i < l; i++) {
                        commitPatch(patch[i], patches);
                    }
                } else {
                    commitPatch(patch, patches);
                }
            },
            (error: Error) => { throw error; },
            () => applyPatches(patches, options)
        );
}

function commitPatch(patch: Patch, patches: Patch[]) {
    if (patch.parentPatch) {
        patch.parentPatch.childrenPatches.push(patch);
    } else {
        patches.push(patch);
    }
}

function renderTree(nextTemplate: Renderable, prevTemplate: Renderable, context: Context, options: Options) {
    return new Observable<Patch>((next, error, complete) => {
        render(nextTemplate, prevTemplate, context.cloneBy({ next, error }), options);
        complete();
    });
}

function render(nextTemplate: Renderable, prevTemplate: Renderable, context: Context, options: Options) {
    if (typeof nextTemplate === 'object') {
        if (nextTemplate instanceof Template) {
            if (typeof nextTemplate.componentType === 'string') {
                renderElement(nextTemplate, prevTemplate, context, options);
            } else if (nextTemplate.componentType.prototype instanceof Component) {
                renderComponent(nextTemplate, prevTemplate, context, options);
            } else if ((nextTemplate.componentType as StatelessComponent<any>).$uberComponent) {
                renderUber(nextTemplate, prevTemplate, context, options);
            } else {
                renderStateless(nextTemplate, prevTemplate, context, options);
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

    if (isSame(nextTemplate, prevTemplate)) {
        // update
    } else {
        if (isMovable(nextTemplate) && options.templatesById[context.id] &&
            isSame(nextTemplate, options.templatesById[context.id])) {
            // move and update
        } else {
            const instance = new componentType(props, options.dispatcher.dispatch);
            const componentTemplate = instance.render();
            const patch: PatchCreate = {
                type: 'create',
                id: context.id,
                template: nextTemplate,
                parentDomNodeId: context.parentDomNodeId,
                componentNode: {
                    props,
                    render: componentTemplate,
                    instance,
                    state: instance.$getState(),
                    parentComponent: context.parentComponent
                },
                childrenPatches: [],
                parentPatch: context.parentPatch
            };
            const nextContext = context.cloneBy({
                id: getId(componentTemplate, context.id, 0, true),
                parentComponent: instance,
                insideCreation: true,
                parentPatch: patch
            });
            context.next(patch);
            if (typeof instance.componentDidCatch === 'function') {
                const patches: Patch[] = [];
                renderTree(componentTemplate, undefined, nextContext, options)
                    .subscribe(
                        (patchInner: Patch | Patch[]) => Array.isArray(patchInner)
                            ? patches.push(...patchInner)
                            : patches.push(patchInner),
                        (e: Error) => {
                            (instance.componentDidCatch as Function)(e);
                            render(instance.render(), undefined, nextContext, options);
                        },
                        () => context.next(patches)
                    );
            } else {
                render(componentTemplate, undefined, nextContext, options);
            }
        }
    }
}

// TODO
function renderUber(nextTemplate: Template, prevTemplate: Renderable, context: Context, options: Options) {
    switch (nextTemplate.componentType) {
        case Flush:
            break;
        case Doctype:
            break;
    }
}

function renderStateless(
    nextTemplate: Template<StatelessComponent<any>>,
    prevTemplate: Renderable,
    context: Context,
    options: Options
) {
    const props = getComponentProps(nextTemplate.props, nextTemplate.children);
    const componentTemplate = nextTemplate.componentType(props);
    const patch: PatchCreate = {
        type: 'create',
        id: context.id,
        template: nextTemplate,
        parentDomNodeId: context.parentDomNodeId,
        componentNode: {
            props,
            render: componentTemplate
        },
        childrenPatches: [],
        parentPatch: context.parentPatch
    };
    const nextContext = context.cloneBy({
        id: getId(componentTemplate, context.id, 0, true),
        insideCreation: true,
        parentPatch: patch
    });
    context.next(patch);
    render(componentTemplate, undefined, nextContext, options);
}

function renderElement(nextTemplate: Template<string>, prevTemplate: Renderable, context: Context, options: Options) {
    if (!isValidTag(nextTemplate.componentType)) {
        context.error(new Error(`Name of tag  "${nextTemplate.componentType}" is not valid`));
        return;
    }

    if (isSame(nextTemplate, prevTemplate)) {
        // update
    } else {
        if (isMovable(nextTemplate) && options.templatesById[context.id] &&
            isSame(nextTemplate, options.templatesById[context.id])) {
            // move and update
        } else {
            const patch: PatchCreate = {
                type: 'create',
                id: context.id,
                parentDomNodeId: context.parentDomNodeId,
                template: nextTemplate,
                childrenPatches: [],
                parentPatch: context.parentPatch
            };
            context.next(patch);
            if (nextTemplate.children) {
                renderArray(nextTemplate.children, undefined, context.cloneBy({
                    parentDomNodeId: context.id,
                    parentPatch: patch,
                    insideCreation: true
                }), options);
            }
        }
    }
}

function renderString(nextTemplate: string, prevTemplate: Renderable, context: Context, options: Options) {
    const patch: PatchCreate = {
        type: 'create',
        id: context.id,
        parentDomNodeId: context.parentDomNodeId,
        template: nextTemplate,
        childrenPatches: [],
        parentPatch: context.parentPatch
    };
    context.next(patch);
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

function isSame(template1: Renderable, template2: Renderable) {
    const type1 = typeof template1;
    const type2 = typeof template2;

    if (isNothing(template1) && isNothing(template2)) {
        return true;
    } else if (type1 === 'object' && type2 === 'object') {
        if (template1 instanceof Template) {
            return template2 instanceof Template && template1.componentType === template2.componentType && (
                (!template1.props && !template2.props) || (
                    (template1.props as any).key === (template2.props as any).key &&
                    (template2.props as any).uniqid === (template2.props as any).uniqid
                )
            );
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

function isMovable(template: Template) {
    return template.props != null &&
        (enabledKeysTypes[typeof template.props.uniqid] || enabledKeysTypes[typeof template.props.uniqid]);
}

function getId(template: Renderable, parentId: string, index: number, needKey?: boolean): string {
    if (template instanceof Template && isMovable(template)) {
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
