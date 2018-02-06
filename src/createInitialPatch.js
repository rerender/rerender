import { VNODE, VTEXT } from './types';
import { Patch, Create, SetRef, AttachEvents, SplitText } from './Patch';

function createInitialPatchRecursive(nextNode, options, insideCreation, nextSibling) {
    if (nextNode.type === VNODE) {
        let childrenCreated;

        if (!insideCreation) {
            options.patch.push(new Create(nextNode));
            childrenCreated = true;
        }

        if (nextNode.attrs) {
            if (typeof nextNode.attrs.ref === 'function') {
                options.patch.pushNormalize(new SetRef(nextNode));
            }
            if (nextNode.dynamic) {
                options.patch.pushNormalize(new AttachEvents(nextNode));
            } else {
                for (let name in nextNode.attrs) {
                    if (name.substr(0, 2) === 'on') {
                        options.patch.pushNormalize(new AttachEvents(nextNode));
                        break;
                    }
                }
            }
        }

        for (let i = 0, l = nextNode.childNodes.length; i < l; i++) {
            createInitialPatchRecursive(
                nextNode.childNodes[i],
                options,
                insideCreation || childrenCreated,
                nextNode.childNodes[i + 1]
            );
        }
    } else if (nextNode.type === VTEXT) {
        if (!insideCreation) {
            options.patch.push(new Create(nextNode));
        }

        if (nextSibling && nextSibling.type === VTEXT) {
            options.patch.pushNormalize(new SplitText(nextNode));
        }
    }
}

function createInitialPatch(nextNode, options = {}) {
    const patch = new Patch(options.document);

    createInitialPatchRecursive(nextNode, { patch });

    return patch;
}

export { createInitialPatch };
