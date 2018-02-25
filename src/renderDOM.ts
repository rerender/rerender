import { Renderable, RenderDOMConfig } from './types';

export function renderDOM(
    template: Renderable,
    { window, domNode = window.document }: RenderDOMConfig = {}
) {
    return;
}
