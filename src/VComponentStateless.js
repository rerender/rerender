import { VCOMPONENT_STATELESS } from './types';

function VComponentStateless({
    render,
    componentType,
    id,
    template,
    componentTemplate,
    context
}) {
    this.render = render;
    this.componentType = componentType;
    this.id = id;
    this.template = template;
    this.componentTemplate = componentTemplate;
    this.context = context;
    this.parent = context.parent;
}

VComponentStateless.prototype = {
    type: VCOMPONENT_STATELESS,

    getParent() {
        return this.parent;
    },

    set(name, value) {
        this[name] = value;
    }
};

export { VComponentStateless };
