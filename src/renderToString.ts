import { Dispatch, Renderable, RenderServerConfig } from './types';
import { noop } from './noop';
import { renderTree } from './renderServer';

export function renderToString(
    template: Renderable,
    { dispatcher = { dispatch: noop } }: RenderServerConfig = {}
): string {
    let html = '';

    renderTree(template, { dispatcher, stream: false, iterations: 1 }, true)
        .subscribe(
            (value: string) => (html += value),
            error => { throw error; }
        );

    return html;
}
