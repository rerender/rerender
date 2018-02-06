import { renderServer } from '../src/renderServer';
import { Component } from '../src/Component';
import { Promise } from '../src/Promise';
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

const renderOptions = {
    hashEnabled: false,
    wrap: false
};

describe('renderServer', () => {
    it('should return instance of Promise', () => {
        expect(renderServer(<div className="block">Text of block</div>, renderOptions) instanceof Promise).toBe(true);
    });

    it('should render div to div', () => {
        return renderServer(<div className="block">Text of block</div>, renderOptions)
            .then(html => {
                expect(html).toEqual('<div class="block">Text of block</div>');

                return renderServer(<div className="block">Text of block</div>, renderOptions);
            })
            .then(html => expect(html).toEqual('<div class="block">Text of block</div>'));
    });

    it('should render component', () => {
        return renderServer(<Block text="Text of block"><p>Text from parent</p></Block>, renderOptions)
            .then(html => expect(html).toEqual('<div class="block"><p>Text of block</p><p>Text from parent</p></div>'));
    });

    it('should render stateless component', () => {
        return renderServer(<Stateless text="Text of block"><p>Text from parent</p></Stateless>, renderOptions)
            .then(html => expect(html) .toEqual('<div class="block"><p>Text of block</p><p>Text from parent</p></div>'));
    });

    it('should render attributes attribute', () => {
        renderServer(<div attributes={{
            class: 'block',
            id: 'id1'
        }}>Text of block</div>, renderOptions)
            .then(html => expect(html).toBe('<div class="block" id="id1">Text of block</div>'));
    });

    it('should render string, number and array as component result', () => {
        function Block({ value }) {
            return value;
        }
        renderServer(<div><Block value='string' /></div>, renderOptions)
            .then(html => expect(html).toBe('<div>string</div>'));

        renderServer(<div><Block value={0} /></div>, renderOptions)
            .then(html => expect(html).toBe('<div>0</div>'));

        renderServer(<div><Block value={['string', 0]} /></div>, renderOptions)
            .then(html => expect(html).toBe('<div>string0</div>'));

        renderServer(<div><Block value={
            [<div>Text</div>, 'string', 0]
        } /></div>, renderOptions)
            .then(html => expect(html).toBe('<div><div>Text</div>string0</div>'));
    });
});
