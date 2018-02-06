import { Context } from './Context';
import { VSandbox } from './VSandbox';

const rootContext = new Context({
    parentId: 'r',
    parentNodeId: 'r',
    index: 0,
    parentPosition: '',
    domIndex: 0
});

function TemplateVSandbox(domNode, template) {
    this.domNode = domNode;
    this.template = template;
}

TemplateVSandbox.prototype = {
    render(config, context) {
        const sandbox = new VSandbox(this.domNode);

        if (context === undefined) {
            context = rootContext;
            context.rootNode = this.domNode;
        }
        context.parentNode = sandbox;
        context.parent = sandbox;
        sandbox.setChilds([this.template.render(config, context)]);

        return sandbox;
    }
};

export { TemplateVSandbox };
