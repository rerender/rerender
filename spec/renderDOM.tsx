/* tslint:disable:member-access max-classes-per-file */
import { JSDOM } from 'jsdom';
import { h, Component } from '../src/';
import { StatelessComponent, RenderDOMConfig } from '../src/types';
import { renderDOM } from '../src/renderDOM';

describe('renderDOM', () => {
    let window: Window;
    let renderDOMConfig: RenderDOMConfig;

    beforeEach(() => {
        window = (new JSDOM()).window;
        renderDOMConfig = {
            window,
            domNode: window.document.body
        };
    });

    it('should render div', () => {
        renderDOM(<div class='block' />, renderDOMConfig);
        expect(window.document.body.innerHTML).toBe('<div class="block"></div>');
    });

    it('should render div with children', () => {
        renderDOM(<div class='block'>text of div</div>, renderDOMConfig);
        expect(window.document.body.innerHTML).toBe('<div class="block">text of div</div>');
    });

    // it('should render Component', () => {
    //     type Props = {
    //         id: string
    //     };
    //
    //     class Block extends Component<Props> {
    //         render() {
    //             const { children, id } = this.props;
    //
    //             return <div class='block' id={id}>
    //                 <input checked value={'some value'} />
    //                 {children}
    //             </div>;
    //         }
    //     }
    //
    //     renderDOM(<Block id='id1'>some text</Block>, renderDOMConfig);
    //     const input: any = window.document.querySelector('input');
    //     expect(window.document.body.innerHTML)
    //         .toBe('<div class="block" id="id1"><input>some text</div>');
    //     expect(input.value).toBe('some value');
    //     expect(input.checked).toBe(true);
    // });
});
