import { Template } from './Template';
import { Renderable, RenderServerConfig } from './types';
import { Observable } from './Observable';

export function renderServer(template: Renderable, config: RenderServerConfig): string {
    let html!: string;
    let error!: Error;

    renderServerCommon(template, { ...config, stream: false, iterations: 1 })
        .subscribe(value => (html = value), errorObj => (error = errorObj));

    if (error) {
        throw error;
    }

    return html;
}

export function renderServerIterations(template: Renderable, config: RenderServerConfig): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        renderServerCommon(template, { ...config, stream: false })
            .subscribe(resolve, reject);
    });
}

export function renderServerStream(template: Renderable, config: RenderServerConfig): Observable<string> {
    return renderServerStream(template, { ...config, stream: true });
}

function renderServerCommon(
    template: Renderable,
    {
        iterations = 1,
        stream = false
    }: RenderServerConfig
): Observable<string> {
    return new Observable((next, error, complete) => {

    });
}
