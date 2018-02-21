import { Template } from './Template';
import { Component } from './Component';
import { TemplateFragment } from './TemplateFragment';
import { ComponentClass, Dispatch, Map, Renderable, RenderServerConfig, StatelessComponent } from './types';
import { Observable } from './Observable';
import { escapeHtml } from './escapeHtml';
import { noop } from './noop';

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

function renderServerCommon(template: Renderable, config: RenderServerConfig): Observable<string> {
    return new Observable((next, error, complete) => {
        try {
            renderIterations(template, config, next, error);
            complete();
        } catch (e) {
            error(e);
        }
    });
}

type Next = (value: string) => any;
type ErrorSignature = (error: Error) => any;

function renderIterations(
    template: Renderable,
    config: RenderServerConfig,
    next: Next,
    error: ErrorSignature
) {
    const { iterations: iterationsCount = 1} = config;

    for (let iteration = 1; iteration <= iterationsCount; iteration++) {
        let html = '';
        const flush = () => {
            next(html);
            html = '';
        };
        const nextInner: Next = (value) => {
            html += value;
        };
        const isLastIteration = iteration === iterationsCount;

        render(template, {
            isLastIteration,
            next: nextInner,
            // TODO: dispatch
            dispatch: noop,
            flush,
            error,
            config
        });

        if (isLastIteration) {
            next(html);
        }
    }
}

type RenderOptions = {
    isLastIteration: boolean,
    next: Next,
    flush: () => void,
    error: ErrorSignature,
    config: RenderServerConfig,
    dispatch: Dispatch
};

function render(template: Renderable, options: RenderOptions) {
    if (typeof template === 'object') {
        if (template instanceof Template) {
            if (typeof template.componentType === 'string') {
                renderElement(template, options);
            } else if (template.componentType instanceof Component) {
                renderComponent(template, options);
            } else {
                renderStateless(template, options);
            }
        } else if (template instanceof TemplateFragment) {
            if (Array.isArray(template.children)) {
                renderArray(template.children, options);
            } else {
                render(template, options);
            }
        } else if (Array.isArray(template)) {
            renderArray(template, options);
        } else if (template !== null) {
            options.error(new Error(
                `Objects are not valid as Rerender child (found: object ${JSON.stringify(template)}). ` +
                'If you meant to render a collection of children, use an array instead.'
            ));
        }
    } else if (!options.isLastIteration) {
        return;
    } else if (typeof template === 'string') {
        options.next(escapeHtml(template as string));
    } else if (typeof template === 'number') {
        options.next(escapeHtml(String(template)));
    }
}

function renderElement(template: Template, options: RenderOptions) {
    if (options.isLastIteration) {
        const attrs: string = template.props ? renderAttrs(template.props) : '';
        // TODO: validate tag
        options.next('<' + template.componentType + attrs + '>');
    }
    if (template.children) {
        renderArray(template.children, options);
    }
    if (options.isLastIteration) {
        options.next('</' + template.componentType + '>');
    }
}

function renderAttrs(props: Map<any>) {
    // TODO style, convert js props to html, attributes?
    return '';
}

function renderComponent(template: Template, options: RenderOptions) {
    const componentType = template.componentType as ComponentClass;
    const props = renderProps(template.props, template.children, componentType.defaultProps);
    const instance = new componentType(props, options.dispatch);
    render(instance.render(), options);
}

function renderStateless(template: Template, options: RenderOptions) {
    const componentType = template.componentType as StatelessComponent<any>;
    const props = renderProps(template.props, template.children);
    render(componentType(props), options);
}

function renderProps(
    props: Map<any> | null | undefined,
    children: Renderable[] | undefined,
    defaultProps?: Map<any>
): Map<any> {
    // TODO
    return {};
}

function renderArray(template: Renderable[], options: RenderOptions) {
    for (let i = 0, l = template.length; i < l; i++) {
        render(template[i], options);
    }
}
