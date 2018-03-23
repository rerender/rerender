import { Map, Patch, DOMNode, PatchCreate, RenderDOMOptions } from './types';
import { Component } from './Component';
import { Template } from './Template';
import { isValidAttr } from './validate';
import { disabledAttrs, mapJsAttrs } from './constants';

export function applyPatches(patches: Patch[], options: RenderDOMOptions, parentDomNode?: DOMNode) {
    for (let i = 0, l = patches.length; i < l; i++) {
        switch (patches[i].type) {
            case 'create':
                applyCreate(patches[i] as PatchCreate, options, parentDomNode);
                break;
        }
    }
}

export function applyCreate(
    patch: PatchCreate,
    options: RenderDOMOptions,
    parentDomNode: DOMNode = options.domNodesById[patch.parentDomNodeId]
) {
    if (patch.template instanceof Template) {
        if (patch.template.componentType.prototype instanceof Component) {
            if (patch.childrenPatches.length) {
                applyPatches(patch.childrenPatches, options);
            }
        } else if (typeof patch.template.componentType === 'string') {
            const domNode = options.document.createElement(patch.template.componentType);
            if (patch.template.props) {
                setAttrs(domNode, patch.template.props);
            }
            options.domNodesById[patch.id] = domNode;
            if (patch.childrenPatches.length) {
                applyPatches(patch.childrenPatches, options);
            }
            parentDomNode.appendChild(domNode);
        }
    } else if (typeof patch.template === 'string') {
        const domNode = options.document.createTextNode(patch.template);
        options.domNodesById[patch.id] = domNode;
        parentDomNode.appendChild(domNode);
    }
}

function setAttrs(domNode: HTMLElement, props: Map<any>) {
    for (const name in props) {
        if (!disabledAttrs[name]) {
            if (!isValidAttr(name)) {
                throw new Error(`attribute "${name}" is not valid`);
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
