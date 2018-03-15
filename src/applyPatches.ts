import { Map, Patch, PatchCreate, RenderDOMOptions } from './types';
import { Template } from './Template';
import { isValidAttr } from './validate';
import { disabledAttrs, mapJsAttrs } from './constants';

export function applyPatches(patches: Patch[], options: RenderDOMOptions, parentDomNode?: HTMLElement) {
    for (let i = 0, l = patches.length; i < l; i++) {
        switch (patches[i].type) {
            case 'create':
                applyCreate(patches[i] as PatchCreate, options, parentDomNode);
                break;
        }
    }
}

export function applyCreate(patch: PatchCreate, options: RenderDOMOptions, parentDomNode?: HTMLElement) {
    if (patch.template instanceof Template) {
        if (typeof patch.template.componentType === 'string') {
            const domNode = options.document.createElement(patch.template.componentType);
            if (patch.template.props) {
                setAttrs(domNode, patch.template.props);
            }
            options.domNodesById[patch.id] = domNode;
            if (patch.childrenPatches.length) {
                applyPatches(patch.childrenPatches, options);
            }
            options.domNodesById[patch.parentDomNodeId].appendChild(domNode);
        }
    } else if (typeof patch.template === 'string') {
        const domNode = options.document.createTextNode(patch.template);
        options.domNodesById[patch.id] = domNode;
        options.domNodesById[patch.parentDomNodeId].appendChild(domNode);
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
