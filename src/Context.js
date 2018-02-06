function Context({
    isDomNode,
    parentId,
    parentNodeId,
    index,
    parentPosition,
    domIndex,
    parent,
    parentNode,
    domLevel,
    key,
    uniqid,
    relativeParentId,
    relativePosition,
    inheritableKey,
    inheritableUniqid,
    rootNode
}) {
    this.parentId = parentId;
    this.parentNodeId = parentNodeId;
    this.index = index;
    this.parentPosition = parentPosition;
    this.domIndex = domIndex;
    this.parent = parent;
    this.parentNode = parentNode;
    this.domLevel = domLevel;
    this.rootNode = rootNode;
    const id = uniqid || `${this.parentId}.${key
        ? `k${key}`
        : (isDomNode
            ? index
            : 'c' + index)}`;

    if (isDomNode) {
        this.position = `${parentPosition || ''}.childNodes[${domIndex}]`;
        if (uniqid || key || inheritableUniqid || inheritableKey) {
            this.relativeParentId = id;
            this.relativePosition = '';
            this.domId = key || inheritableKey || !relativeParentId
                ? `${parentNodeId}.childNodes[${domIndex}]`
                : `${relativeParentId}${relativePosition}.childNodes[${domIndex}]`;
            if (key || inheritableKey) {
                this.hasKey = true;
            }
        } else {
            this.relativeParentId = relativeParentId;
            this.relativePosition = `${relativePosition}.childNodes[${domIndex}]`;
        }
    } else {
        this.inheritableKey = key || inheritableKey;
        this.inheritableUniqid = uniqid || inheritableUniqid;
        this.relativeParentId = relativeParentId;
        this.relativePosition = relativePosition;
    }

    this.id = id;
}

Context.prototype = {
    addIdLevel(component) {
        return new Context({
            parentId: this.id,
            index: 0,
            parent: component || this.parent,

            // no rewrite
            domLevel: !component && this.domLevel,
            parentNodeId: this.parentNodeId,
            parentPosition: this.position || this.parentPosition,
            domIndex: this.domIndex,
            parentNode: this.parentNode,
            relativeParentId: this.relativeParentId,
            relativePosition: this.relativePosition,
            inheritableKey: this.inheritableKey,
            inheritableUniqid: this.inheritableUniqid,
            rootNode: this.rootNode
        });
    },

    addDomLevel(node, id) {
        return new Context({
            domLevel: true,
            parentId: this.id,
            index: 0,
            parentPosition: this.position || this.parentPosition,
            domIndex: 0,
            parent: node,
            parentNode: node,
            parentNodeId: id,

            // no rewrite
            relativeParentId: this.relativeParentId,
            relativePosition: this.relativePosition,
            inheritableKey: this.inheritableKey,
            inheritableUniqid: this.inheritableUniqid,
            rootNode: this.rootNode
        });
    },

    incrementComponent(key, uniqid) {
        return new Context({
            index: (key || uniqid) ? this.index : this.index++,
            domIndex: this.domLevel ? this.domIndex++ : this.domIndex,
            key,
            uniqid,

            // no rewrite
            domLevel: this.domLevel,
            parentId: this.parentId,
            parentNodeId: this.parentNodeId,
            parentPosition: this.parentPosition,
            parent: this.parent,
            parentNode: this.parentNode,
            relativeParentId: this.relativeParentId,
            relativePosition: this.relativePosition,
            inheritableKey: this.inheritableKey,
            inheritableUniqid: this.inheritableUniqid,
            rootNode: this.rootNode
        });
    },

    incrementDom(key, uniqid) {
        return new Context({
            isDomNode: true,
            index: (key || uniqid) ? this.index : this.index++,
            domIndex: this.domIndex++,
            key,
            uniqid,

            // no rewrite
            domLevel: this.domLevel,
            parentId: this.parentId,
            parentNodeId: this.parentNodeId,
            parentPosition: this.parentPosition,
            parent: this.parent,
            parentNode: this.parentNode,
            relativeParentId: this.relativeParentId,
            relativePosition: this.relativePosition,
            inheritableKey: this.inheritableKey,
            inheritableUniqid: this.inheritableUniqid,
            rootNode: this.rootNode
        });
    },

    getId() {
        return this.id;
    },

    getDomNode() {
        return (new Function('rootNode', `return rootNode${this.position}`))(this.rootNode);
    },

    getDomId() {
        return this.domId;
    },

    getParent() {
        return this.parent;
    },

    getParentNode() {
        return this.parentNode;
    }
};

export { Context };
