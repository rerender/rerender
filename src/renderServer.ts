import { Template } from './Template';
import { Renderable } from './types';
import { Observable } from './Observable';

export function renderServer(template: Renderable): string {
    return '';
}

export function renderServerIterations(template: Renderable): Promise<string> {
    return Promise.resolve('');
}

export function renderServerStream(template: Renderable): Observable<string> {
    return renderServerCommon(template);
}

export function renderServerCommon(template: Renderable): Observable<string> {
    return new Observable((next, error, complete) => {});
}
