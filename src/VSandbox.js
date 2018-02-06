import { VSANDBOX } from './types';

function VSandbox(domNode) {
    this.parent = null;
    this.parentNode = null;
    this.childNodes = [];
    this.domNode = domNode;
}

VSandbox.prototype = {
    type: VSANDBOX,

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
        return this.domNode;
    }
};

export { VSandbox };
