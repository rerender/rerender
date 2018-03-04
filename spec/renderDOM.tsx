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
});
