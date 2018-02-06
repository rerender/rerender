import { jsdom } from 'jsdom';
import { renderClient } from '../src/renderClient';
import { Component } from '../src/Component';
import { createTemplate } from '../src/createTemplate';

class Block extends Component {
    render() {
        return <div className={this.props.className}><p>{this.props.text}</p>{this.props.children}</div>;
    }
}

Block.defaults = {
    className: 'block'
};

function Stateless(props) {
    return <div className={props.className}><p>{props.text}</p>{props.children}</div>;
}

Stateless.defaults = {
    className: 'block'
};

let window;
let renderOptions;
describe('renderClient', () => {
    beforeEach(() => {
        window = jsdom('<div id="application"></div>').defaultView.window;
        renderOptions = {
            window,
            settings: {},
            applicationId: 'application'
        };
    });

    it('should render div to div', () => {
        renderClient(<div className="block">Text of block</div>, renderOptions);

        expect(window.document.getElementById('application').innerHTML)
            .toBe('<div class="block">Text of block</div>');
    });

    it('should render component', () => {
        renderClient(<Block text="Text of block"><p>Text from parent</p></Block>, renderOptions);

        expect(window.document.getElementById('application').innerHTML)
            .toBe('<div class="block"><p>Text of block</p><p>Text from parent</p></div>');
    });
});
