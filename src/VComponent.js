import { VCOMPONENT } from './types';

function VComponent({
    render,
    componentWillReceiveProps,
    componentType,
    id,
    componentTemplate,
    context,
    ref
}) {
    this.render = render;
    this.componentWillReceiveProps = componentWillReceiveProps;
    this.componentType = componentType;
    this.id = id;
    this.componentTemplate = componentTemplate;
    this.context = context;
    this.ref = ref;
    this.parent = context.parent;
}

VComponent.prototype = {
    type: VCOMPONENT,

    getParent() {
        return this.parent;
    },

    set(name, value) {
        this[name] = value;
    }
};

export { VComponent };
