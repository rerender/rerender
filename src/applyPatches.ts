import { Patch, RenderDOMOptions } from './types';

// TODO
export function applyPatches(patches: Patch[], options: RenderDOMOptions) {
    for (let i = 0, l = patches.length; i < l; i++) {
        const patch = patches[i];
        switch (patch.type) {
            case 'create':
                if (patch.parentDomNode.childNodes[patch.domIndex]) {
                    patch.parentDomNode.insertBefore(patch.parentDomNode.childNodes[patch.domIndex], patch.domNode);
                } else {
                    patch.parentDomNode.appendChild(patch.domNode);
                }
                break;
        }
    }
}
