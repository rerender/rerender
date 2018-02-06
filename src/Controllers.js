import { Component } from './Component';
import { createDecorator } from './createDecorator';
import { createTemplate } from './createTemplate';

class Controllers extends Component {
    init() {
        this.reWrap();
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.targetComponentType !== this.targetComponentType) {
            this.reWrap(nextProps);
        }
    }

    reWrap(props = this.props) {
        this.controllers = this.getControllers(props);

        this.setState({
            Root: this.getWrapped()
        });
    }

    getWrapped() {
        let current = this.props.targetComponentType;

        for (let i = this.controllers.length - 1; i >= 0; i--) {
            current = createDecorator(this.controllers[i].controller)(
                this.controllers[i].options,
                this.controllers[i].settings
            )(current);
        }

        return current;
    }

    getControllers(props) {
        const controllers = [];
        const componentType = this.props.targetComponentType;

        if (props.targetController) {
            if (Array.isArray(props.targetController)) {
                controllers.push.apply(controllers, props.targetController);
            } else {
                controllers.push(props.targetController);
            }
        }

        if (componentType !== 'string' && componentType.controller !== undefined) {
            if (Array.isArray(componentType.controller)) {
                controllers.concat(componentType.controller);
            } else {
                controllers.push(componentType.controller);
            }
        }

        return controllers;
    }

    render() {
        const { Root } = this.state;

        return createTemplate(Root, this.props, this.props.children);
    }
}

Controllers.wrapper = true;

export { Controllers };
