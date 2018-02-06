import { VNODE } from './types';

function VNode(tag, attrs, context) {
    this.tag = tag;
    this.attrs = attrs;
    this.parent = context.parent;
    this.parentNode = context.parentNode;
    this.childNodes = [];
    this.context = context;
    context.getParentNode().appendChild(this);
}

VNode.prototype = {
    type: VNODE,

    setDynamic(dynamic) {
        this.dynamic = dynamic;
    },

    setChilds(childs) {
        this.childs = childs;
    },

    appendChild(childNode) {
        this.childNodes.push(childNode);
    },

    getParent() {
        return this.parent;
    },

    getDomNode() {
        return this._node || (this._node = this.context.getDomNode());
    }
};

export { VNode };
