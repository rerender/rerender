import { TEMPLATE, TEMPLATE_COMPONENT_STATELESS, TEMPLATE_VNODE, VCOMPONENT_STATELESS } from './types';
import { stringifyChildrenItem } from './TemplateVNode';
import { VComponentStateless } from './VComponentStateless';
import { memoizeLast, shallowEqualProps } from './utils';
import { VText } from './VText';

const SPECIAL_PROPS = {
    key: true,
    uniqid: true
};

function TemplateComponentStateless(componentType, props, children) {
    let nextProps = props || {};

    nextProps = Object.keys(nextProps).reduce((memo, key) => {
        if (SPECIAL_PROPS[key]) {
            this[key] = nextProps[key];
        } else {
            memo[key] = nextProps[key];
        }

        return memo;
    }, {});

    nextProps.children = children;

    if (componentType.defaults) {
        for (let name in componentType.defaults) {
            if (nextProps[name] === undefined) {
                nextProps[name] = componentType.defaults[name];
            }
        }
    }

    this.componentType = componentType;
    this.props = nextProps;
}

TemplateComponentStateless.prototype = {
    type: TEMPLATE,
    subtype: TEMPLATE_COMPONENT_STATELESS,

    renderServer(config) {
        return stringifyChildrenItem(this.componentType(this.props), config);
    },

    render(config, context) {
        let props = this.props;
        let template;
        let component;
        const componentType = this.componentType;
        const { components, nextComponents } = config;
        const id = context.getId();
        let prev = components[id];

        if (prev === undefined || prev.type !== VCOMPONENT_STATELESS || prev.componentType !== componentType) {
            const render = memoizeLast(
                componentType,
                [ shallowEqualProps ]
            );
            template = render(props);
            component = new VComponentStateless({
                render,
                componentType,
                id,
                template,
                templateComponent: this,
                context
            });

            nextComponents[id] = component;
        } else {
            template = prev.render(props);

            component = new VComponentStateless({
                render: prev.render,
                componentType,
                id,
                template,
                templateComponent: this,
                context
            });
            nextComponents[id] = component;
        }

        // FIXME: createText and move increment inside render
        let childs;

        if (template) {
            childs = template.render(
                config,
                context.addIdLevel(component)[
                    template.subtype === TEMPLATE_VNODE
                        ? 'incrementDom'
                        : 'incrementComponent'
                ](template.key, template.uniqid)
            );
        } else {
            const nextContext = context.addIdLevel(component).incrementDom();
            const nextTextNode = new VText('', nextContext);
            childs = nextTextNode;
            config.nextNodes[nextContext.getId()] = nextTextNode;
        }

        component.set('childs', [childs]);

        return component;
    }
};

export { TemplateComponentStateless };
