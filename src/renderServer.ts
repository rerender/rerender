import { Template } from './Template';
import { Component } from './Component';
import { TemplateFragment } from './TemplateFragment';
import { Flush, Doctype } from './uberComponents';
import { ComponentClass, Dispatch, Map, Renderable, RenderServerConfig, StatelessComponent } from './types';
import { Observable } from './Observable';
import { escapeHtml } from './escapeHtml';
import { escapeHtmlAttr } from './escapeHtmlAttr';
import { isValidTag, isValidAttr } from './validate';
import { noop } from './noop';
import { disabledAttrs, intrinsicProps, intrinsicPropsWrapper, serverIgnoreAttrTypes } from './constants';

export function renderToString(template: Renderable, config: RenderServerConfig = {}): string {
    let html = '';

    render(template, {
        isLastIteration: true,
        next: (value: string) => (html += value),
        error: (error: Error) => {
            throw error;
        },
        // TODO: dispatch
        dispatch: noop,
        flush: noop,
        config: { ...config, stream: false, iterations: 1 }
    });

    return html;
}

export function renderServer(template: Renderable, config: RenderServerConfig = {}): Observable<string> {
    return new Observable(async (next, error, complete) => {
        const { iterations = 1} = config;

        for (let iteration = 1; iteration <= iterations; iteration++) {
            let html = '';
            const isLastIteration = iteration === iterations;

            render(template, {
                isLastIteration,
                next: (value) => {
                    html += value;
                },
                error,
                // TODO: dispatch
                dispatch: noop,
                flush: () => {
                    next(html);
                    html = '';
                },
                config
            });

            if (isLastIteration) {
                next(html);
                complete();
            } else {
                // TODO: await for all dispatch
            }
        }
    }, { isAsync: true });
}

type Next = (value: string) => any;
type ErrorSignature = (error: Error) => any;

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
            } else if (template.componentType.prototype instanceof Component) {
                renderComponent(template, options);
            } else if ((template.componentType as StatelessComponent<any>).$uberComponent) {
                renderUber(template, options);
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
                `Objects are not valid as Rerender child (found: object ${escapeHtml(JSON.stringify(template))}). ` +
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
        if (!isValidTag(template.componentType as string)) {
            options.error(new Error(`Name of tag  "${escapeHtml(template.componentType as string)}" is not valid`));
        }
        const attrs: string = template.props ? getAttrs(template.props, options) : '';
        options.next('<' + template.componentType + attrs + '>');
    }
    if (template.children) {
        renderArray(template.children, options);
    } else if (template.props && typeof template.props.dangerousInnerHtml === 'string') {
        options.next(template.props.dangerousInnerHtml);
    }
    if (options.isLastIteration) {
        options.next('</' + template.componentType + '>');
    }
}

function getAttrs(props: Map<any>, options: RenderOptions) {
    let attrs = '';

    for (const name in props) {
        if (!disabledAttrs[name] && !serverIgnoreAttrTypes[typeof props[name]]) {
            if (!isValidAttr(name)) {
                options.error(new Error(`attribute "${escapeHtml(name)}" is not valid`));
            }
            attrs += getAttr(name, props[name]);
        }
    }

    return attrs;
}

function getAttr(name: string, value: any) {
    if (typeof value === 'boolean') {
        return value === false ? '' : ' ' + name;
    }

    return ' ' + name + '="' + escapeHtmlAttr(String(value)) + '"';
}

function renderComponent(template: Template, options: RenderOptions) {
    const componentType = template.componentType as ComponentClass;
    const props = getComponentProps(
        template.props,
        template.children,
        componentType.defaultProps,
        componentType.wrapper ? intrinsicPropsWrapper : intrinsicProps
    );
    const instance = new componentType(props, options.dispatch);
    if (typeof instance.componentDidCatch === 'function') {
        renderInstanceWithCatch(instance, options);
    } else {
        render(instance.render(), options);
    }
}

function renderInstanceWithCatch(instance: Component<any>, options: RenderOptions) {
    const componentTemplate = instance.render();
    try {
        let flushed = false;
        let html = '';
        render(componentTemplate, {
            ...options,
            next: value => (html += value),
            flush: () => {
                if (options.isLastIteration && options.config.stream) {
                    options.next(html);
                    options.flush();
                    flushed = true;
                    html = '';
                }
            },
            error: e => {
                if (!flushed) {
                    throw e;
                } else {
                    options.error(e);
                }
            }
        });
        options.next(html);
    } catch (e) {
        (instance.componentDidCatch as Function)(e);
        render(instance.render(), options);
    }
}

function renderStateless(template: Template, options: RenderOptions) {
    const componentType = template.componentType as StatelessComponent<any>;
    const props = getComponentProps(template.props, template.children);
    render(componentType(props), options);
}

function renderUber(template: Template, options: RenderOptions) {
    switch (template.componentType) {
        case Flush:
            if (options.isLastIteration && options.config.stream) {
                options.flush();
            }
            break;
        case Doctype:
            if (options.isLastIteration) {
                options.next('<!DOCTYPE html>');
            }
            break;
    }
}

function renderArray(template: Renderable[], options: RenderOptions) {
    for (let i = 0, l = template.length; i < l; i++) {
        render(template[i], options);
    }
}

function getComponentProps(
    props: Map<any> | null | undefined,
    children: Renderable[] | undefined,
    defaultProps?: Map<any>,
    intrinsic: Map<any> = intrinsicProps
): Map<any> {
    const componentProps: Map<any> = Object.keys(props || {})
        .reduce((memo: Map<any>, key) => {
            if (!intrinsic[key]) {
                memo[key] = (props as Map<any>)[key];
            }

            return memo;
        }, {});

    if (Array.isArray(children)) {
        if (children.length > 1) {
            // TODO: no need TemplateFragment here on server?
            componentProps.children = new TemplateFragment(children);
        } else {
            componentProps.children = children[0];
        }
    } else {
        componentProps.children = children;
    }

    if (defaultProps) {
        for (const name in defaultProps) {
            if (componentProps[name] === undefined) {
                componentProps[name] = defaultProps[name];
            }
        }
    }

    return componentProps;
}
