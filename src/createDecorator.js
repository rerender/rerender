import { createTemplate } from './createTemplate';

function createDecorator (Wrapper) {
    return options => Wrapped => {
        class Decorator extends Wrapper {
            constructor(...args) {
                super(...args);
                this.setState = this.setState.bind(this); // hoist in prototype chain
                this.options = options;
                this.Wrapped = Wrapped;
            }
        }

        if (!Wrapper.prototype.hasOwnProperty('render')) {
            Decorator.prototype.render = function() {
                return createTemplate(
                    this.Wrapped,
                    typeof this.renderProps === 'function' ? this.renderProps() : this.props,
                    this.props.children
                );
            };
        }

        const wrapperStaticKeys = Object.keys(Wrapper);
        for (let i = 0, l = wrapperStaticKeys.length; i < l; i++) {
            Decorator[wrapperStaticKeys[i]] = Wrapper[wrapperStaticKeys[i]];
        }

        Decorator.wrapper = true;

        return Decorator;
    };
}

export { createDecorator };
