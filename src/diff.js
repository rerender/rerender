import { VNODE, VTEXT } from './types';
import { Patch, Create, Replace, Move, Update, Remove, RemoveRef } from './Patch';
import { shallowEqual, groupByIdNodes } from './utils';

function diffNext(nextNode, options, insideCreation) {
    if (nextNode.type === VNODE) {
        const context = nextNode.context;
        const node = options.nodesById[context.id];
        let childrenCreated;
        let childrenNeedCreation;

        if (!node) {
            if (!insideCreation) {
                options.patch.push(new Create(nextNode));
                childrenCreated = true;
            }
        } else {
            if (node.tag !== nextNode.tag) {
                if (!insideCreation) {
                    options.patch.push(new Replace(nextNode));
                    childrenCreated = true;
                }
            } else if (node.context.domId !== context.domId) {
                options.patch.push(new Move(nextNode, node));
                childrenNeedCreation = true;
            }

            if (!shallowEqual(node.attrs, nextNode.attrs)
                || (nextNode.dynamic && nextNode.dynamic.prevAttrs)) {
                options.patch.push(new Update(nextNode, node));
            }
        }

        for (let i = 0, l = nextNode.childNodes.length; i < l; i++) {
            diffNext(
                nextNode.childNodes[i],
                options,
                childrenNeedCreation
                    ? false
                    : insideCreation || childrenCreated
            );
        }
    } else if (nextNode.type === VTEXT) {
        const context = nextNode.context;
        const node = options.nodesById[context.id];
        if (!node) {
            if (!insideCreation) {
                options.patch.push(new Create(nextNode));
            }
        } else if (node.value !== nextNode.value) {
            options.patch.push(new Replace(nextNode));
        }
    }
}

function diffPrev(node, options, insideRemove) {
    let childrenRemoved;
    let childrenNeedRemove;

    if (!options.nextNodesById[node.context.id]) {
        if (!insideRemove) {
            options.patch.push(new Remove(node));
            childrenRemoved = true;
        } else if (node.attrs && typeof node.attrs.ref === 'function') {
            options.patch.push(new RemoveRef(node));
        }
    } else if (insideRemove) {
        childrenNeedRemove = true;
    }

    if (node.type === VNODE) {
        for (let i = 0, l = node.childNodes.length; i < l; i++) {
            diffPrev(
                node.childNodes[i],
                options,
                childrenNeedRemove
                    ? false
                    : insideRemove || childrenRemoved
            );
        }
    }
}

function diff(nextNode, node, options = {}) {
    const patch = new Patch(options.document);
    const nodesById = options.nodesById || groupByIdNodes(node, {});
    const nextNodesById = options.nextNodesById || groupByIdNodes(nextNode, {});

    diffNext(nextNode, {
        nodesById,
        patch
    });

    diffPrev(node, {
        nextNodesById,
        patch
    });

    return patch;
}

export { diff };
