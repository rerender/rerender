import { VNODE } from './types';
import { noRenderAttrs } from './constants';

const CREATE = 'CREATE';
const MOVE = 'MOVE';
const REMOVE = 'REMOVE';
const REPLACE = 'REPLACE';
const UPDATE = 'UPDATE';
const UPDATE_DYNAMIC = 'UPDATE_DYNAMIC';
const SPLIT_TEXT = 'SPLIT_TEXT';
const SET_REF = 'SET_REF';
const REMOVE_REF = 'REMOVE_REF';
const ATTACH_EVENTS = 'ATTACH_EVENTS';
const catchEvent = function(event) {
    event.stopPropagation();
};

function Patch (document = self.document) {
    this.document = document;
    this.commands = [];
    this.setRefCommands = [];
    this.splitTextCommands = [];
    this.eventsCommands = [];
}

Patch.prototype = {
    apply() {
        const domNodes = [];
        const document = this.document;
        const options = {
            document,
            skipCreation: {}
        };

        for (let i = 0, l = this.commands.length; i < l; i++) {
            const command = this.commands[i];

            if (command.type !== CREATE && command.type !== REMOVE_REF) {
                domNodes[i] = command.refNode.getDomNode();
                if (command.type === MOVE) {
                    options.skipCreation[command.nextNode.context.id] = true;
                }
            }
        }

        const prevActiveElement = document.activeElement;
        const body = document.body;
        let prevOnblur;

        if (prevActiveElement && prevActiveElement !== body) {
            prevOnblur = prevActiveElement.onblur;
            prevActiveElement.onblur = catchEvent;
        }

        for (let i = 0, l = this.commands.length; i < l; i++) {
            this.commands[i].apply(options, domNodes[i]);
        }

        const activeElement = document.activeElement;

        if (prevActiveElement && prevActiveElement !== body) {
            if (prevActiveElement.onblur === catchEvent) {
                prevActiveElement.onblur = prevOnblur;
            }
            if ((!activeElement || activeElement === document.body) && prevActiveElement.parentNode) {
                const prevOnfocus = prevActiveElement.onfocus;
                prevActiveElement.onfocus = catchEvent;
                prevActiveElement.focus();
                prevActiveElement.onfocus = prevOnfocus;
            }
        }
    },

    applyNormalize() {
        for (let i = 0, l = this.splitTextCommands.length; i < l; i++) {
            this.splitTextCommands[i].apply();
        }

        for (let i = 0, l = this.setRefCommands.length; i < l; i++) {
            this.setRefCommands[i].apply();
        }

        for (let i = 0, l = this.eventsCommands.length; i < l; i++) {
            this.eventsCommands[i].apply();
        }
    },

    push(command) {
        this.commands.push(command);
    },

    pushNormalize(command) {
        switch (command.type) {
            case SPLIT_TEXT:
                this.splitTextCommands.push(command);
                break;
            case SET_REF:
                this.setRefCommands.push(command);
                break;
            case ATTACH_EVENTS:
                this.eventsCommands.push(command);
                break;
        }
    }
};

function Create(nextNode) {
    this.nextNode = nextNode;
}
Create.prototype = {
    type: CREATE,

    apply(options) {
        const parentDomNode = this.nextNode.parentNode.getDomNode();
        const domNode = parentDomNode.childNodes[this.nextNode.context.domIndex];
        const nextDomNode = createElement(this.nextNode, options.document, options.skipCreation);

        if (domNode) {
            parentDomNode.replaceChild(nextDomNode, domNode);
        } else {
            parentDomNode.appendChild(nextDomNode);
        }
    }
};

function Move(nextNode, node) {
    this.nextNode = nextNode;
    this.node = node;
    this.refNode = node;
}
Move.prototype = {
    type: MOVE,

    apply(options, prevDomNode) {
        const parentDomNode = this.nextNode.parentNode.getDomNode();
        const domNode = parentDomNode.childNodes[this.nextNode.context.domIndex];

        if (!this.nextNode.context.hasKey && prevDomNode.parentNode) {
            prevDomNode.parentNode.replaceChild(document.createTextNode(''), prevDomNode);
        }

        if (domNode) {
            parentDomNode.replaceChild(prevDomNode, domNode);
        } else {
            parentDomNode.appendChild(prevDomNode);
        }
    }
};

function Remove(node) {
    this.node = node;
    this.refNode = node;
}
Remove.prototype = {
    type: REMOVE,

    apply(options, domNode) {
        if (this.node.type === VNODE && this.node.attrs && typeof this.node.attrs.ref === 'function') {
            this.node.attrs.ref(null);
        }

        if (domNode.parentNode) {
            domNode.parentNode.removeChild(domNode);
        }
    }
};

function RemoveRef(node) {
    this.node = node;
}
RemoveRef.prototype = {
    type: REMOVE_REF,

    apply() {
        this.node.attrs.ref(null);
    }
};

function Replace(nextNode) {
    this.nextNode = nextNode;
    this.refNode = nextNode;
}
Replace.prototype = {
    type: REPLACE,

    apply(options, domNode) {
        const nextDomNode = createElement(this.nextNode, options.document, options.skipCreation);

        domNode.parentNode.replaceChild(
            nextDomNode,
            domNode
        );
    }
};

function SetRef(nextNode) {
    this.nextNode = nextNode;
}
SetRef.prototype = {
    type: SET_REF,

    apply() {
        this.nextNode.attrs.ref(this.nextNode.dynamic);
    }
};

function SplitText(nextNode) {
    this.nextNode = nextNode;
}
SplitText.prototype = {
    type: SPLIT_TEXT,

    apply() {
        this.nextNode.getDomNode().splitText(this.nextNode.value.length);
    }
};

function Update(nextNode, node) {
    this.nextNode = nextNode;
    this.node = node;
    this.refNode = nextNode;
}
Update.prototype = {
    type: UPDATE,

    apply(options, domNode) {
        if (this.nextNode.dynamic && this.nextNode.dynamic.prevAttrs) {
            this.applyDynamic(options, domNode);
        } else {
            const nextAttrs = this.nextNode.attrs;
            const attrs = this.node.attrs;

            if (nextAttrs) {
                for (let name in nextAttrs) {
                    if ((!attrs || nextAttrs[name] !== attrs[name]) && !noRenderAttrs[name]) {
                        domNode[name] = nextAttrs[name];
                    }
                }
            }
            if (attrs) {
                for (let name in attrs) {
                    if (!nextAttrs || nextAttrs[name] === undefined) {
                        domNode[name] = null;
                    }
                }
            }
        }
    },

    applyDynamic(options, domNode) {
        const nextAttrsDynamic = this.nextNode.dynamic.attrs;
        const attrsDynamic = this.nextNode.dynamic.prevAttrs;
        const nextAttrs = this.nextNode.attrs;
        const attrs = this.node.attrs;

        for (let name in nextAttrsDynamic) {
            if (nextAttrsDynamic[name] !== attrsDynamic[name]) {
                domNode[name] = nextAttrsDynamic[name];
            }
        }

        for (let name in attrsDynamic) {
            if (!nextAttrsDynamic[name]) {
                domNode[name] = nextAttrs && nextAttrs[name] || null;
            }
        }

        if (nextAttrs) {
            for (let name in nextAttrs) {
                if (nextAttrsDynamic[name] === undefined && (!attrs || nextAttrs[name] !== attrs[name]) && !noRenderAttrs[name]) {
                    domNode[name] = nextAttrs[name];
                }
            }
        }
        if (attrs) {
            for (let name in attrs) {
                if (!nextAttrsDynamic[name] && !attrsDynamic[name] && (!nextAttrs || nextAttrs[name] === undefined)) {
                    domNode[name] = null;
                }
            }
        }

        delete this.node.dynamic.prevAttrs;
    }
};

function UpdateDynamic(node) {
    this.node = node;
}
UpdateDynamic.prototype = {
    type: UPDATE_DYNAMIC,

    apply() {
        const prevAttrs = this.node.dynamic.prevAttrs;
        const attrs = this.node.dynamic.attrs;
        const domNode = this.node.getDomNode();

        if (prevAttrs) {
            for (let name in attrs) {
                if (attrs[name] !== prevAttrs[name]) {
                    domNode[name] = attrs[name];
                }
            }

            for (let name in prevAttrs) {
                if (attrs[name] === undefined) {
                    domNode[name] = this.node.attrs && this.node.attrs[name] || null;
                }
            }

            this.node.dynamic._setUpdated();
        }
    }
};
// TODO: rename AttachEventsAndDynamic
function AttachEvents(nextNode) {
    this.nextNode = nextNode;
}
AttachEvents.prototype = {
    type: ATTACH_EVENTS,

    apply() {
        const domNode = this.nextNode.getDomNode();
        const nextAttrs = this.nextNode.attrs;

        if (this.nextNode.dynamic) {
            this.applyDynamic();
        } else {
            for (let name in nextAttrs) {
                if (name.substr(0,2) === 'on') {
                    domNode[name] = nextAttrs[name];
                }
            }
        }
    },

    applyDynamic() {
        const domNode = this.nextNode.getDomNode();
        const nextAttrs = this.nextNode.attrs;
        const dynamicAttrs = this.nextNode.dynamic.attrs;

        for (let name in dynamicAttrs) {
            domNode[name] = dynamicAttrs[name];
        }

        for (let name in nextAttrs) {
            if (name.substr(0,2) === 'on' && dynamicAttrs[name] === undefined) {
                domNode[name] = nextAttrs[name];
            }
        }
    }
};

function createElement(nextNode, document, skipCreation) {
    let nextDomNode;

    if (nextNode.type === VNODE) {
        if (!skipCreation[nextNode.context.id]) {
            nextDomNode = document.createElement(nextNode.tag);

            if (nextNode.dynamic) {
                for (let name in nextNode.dynamic.attrs) {
                    nextDomNode[name] = nextNode.dynamic.attrs[name];
                }

                if (nextNode.attrs) {
                    for (let name in nextNode.attrs) {
                        if (!noRenderAttrs[name] && nextNode.dynamic.attrs[name] === undefined) {
                            nextDomNode[name] = nextNode.attrs[name];
                        }
                    }

                    if (typeof nextNode.attrs.ref === 'function') {
                        nextNode.attrs.ref(nextNode.dynamic);
                    }
                }
            } else if (nextNode.attrs) {
                for (let name in nextNode.attrs) {
                    if (!noRenderAttrs[name]) {
                        nextDomNode[name] = nextNode.attrs[name];
                    }
                }

                if (typeof nextNode.attrs.ref === 'function') {
                    nextNode.attrs.ref(nextNode.dynamic);
                }
            }

            for (let i = 0, l = nextNode.childNodes.length; i < l; i++) {
                nextDomNode.appendChild(createElement(nextNode.childNodes[i], document, skipCreation));
            }
        } else {
            nextDomNode = document.createTextNode('');
        }
    } else {
        nextDomNode = document.createTextNode(nextNode.value);
    }

    return nextDomNode;
}

export {
    Patch,
    Create,
    Move,
    Remove,
    Replace,
    SetRef,
    RemoveRef,
    SplitText,
    Update,
    UpdateDynamic,
    AttachEvents
};
