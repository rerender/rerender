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
import { getComponentProps } from './getComponentProps';
import { disabledAttrs, intrinsicProps, intrinsicPropsWrapper, serverIgnoreAttrTypes } from './constants';

export function renderServer(template: Renderable, config: RenderServerConfig = {}): Observable<string> {
    return new Observable(async (next, error, complete) => {
        const { iterations = 1, stream, dispatcher = { dispatch: noop } } = config;
        let html = '';

        for (let iteration = 1; iteration <= iterations; iteration++) {
            const isLastIteration = iteration === iterations;

            renderTree(template, { stream, dispatcher }, isLastIteration)
                .subscribe(
                    stream ? (value: string, flush?: boolean) => {
                        html += value;
                        if (flush) {
                            next(html, true);
                            html = '';
                        }
                    } : (value: string) => (html += value),
                    e => error(e)
                );

            if (!isLastIteration) {
                // TODO: await for all dispatch
            }
        }

        next(html);
        complete();
    });
}

type Next = (value: string, flush?: boolean) => any;

export function renderTree(template: Renderable, config: RenderServerConfig, isLastIteration: boolean) {
    return new Observable((next, error, complete) => {
        render(template, config, isLastIteration ? next : undefined);
        complete();
    });
}

function render(template: Renderable, config: RenderServerConfig, next?: Next) {
    if (typeof template === 'object') {
        if (template instanceof Template) {
            if (typeof template.componentType === 'string') {
                renderElement(template, config, next);
            } else if (template.componentType.prototype instanceof Component) {
                renderComponent(template, config, next);
            } else if ((template.componentType as StatelessComponent<any>).$uberComponent) {
                renderUber(template, config, next);
            } else {
                renderStateless(template, config, next);
            }
        } else if (template instanceof TemplateFragment) {
            if (Array.isArray(template.children)) {
                renderArray(template.children, config, next);
            } else {
                render(template, config, next);
            }
        } else if (Array.isArray(template)) {
            renderArray(template, config, next);
        } else if (template !== null) {
            throw new Error(
                `Objects are not valid as Rerender child (found: object ${escapeHtml(JSON.stringify(template))}). ` +
                'If you meant to render a collection of children, use an array instead.'
            );
        }
    } else if (!next) {
        return;
    } else if (typeof template === 'string') {
        next(escapeHtml(template));
    } else if (typeof template === 'number') {
        next(escapeHtml(String(template)));
    }
}

function renderElement(template: Template<string>, config: RenderServerConfig, next?: Next) {
    if (next) {
        if (!isValidTag(template.componentType)) {
            throw new Error(`Name of tag  "${escapeHtml(template.componentType)}" is not valid`);
        }
        const attrs: string = template.props ? getAttrs(template.props) : '';
        next('<' + template.componentType + attrs + '>');
    }
    if (template.children) {
        renderArray(template.children, config, next);
    } else if (next && template.props && typeof template.props.dangerousInnerHtml === 'string') {
        next(template.props.dangerousInnerHtml);
    }
    if (next) {
        next('</' + template.componentType + '>');
    }
}

function getAttrs(props: Map<any>) {
    let attrs = '';

    for (const name in props) {
        if (!disabledAttrs[name] && !serverIgnoreAttrTypes[typeof props[name]]) {
            if (!isValidAttr(name)) {
                throw new Error(`attribute "${escapeHtml(name)}" is not valid`);
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

function renderComponent(template: Template<ComponentClass>, config: RenderServerConfig, next?: Next) {
    const componentType = template.componentType;
    const props = getComponentProps(
        template.props,
        template.children,
        componentType.defaultProps,
        componentType.wrapper ? intrinsicPropsWrapper : intrinsicProps
    );
    const instance = new componentType(props, (config.dispatcher as any).dispatch);
    if (typeof instance.componentDidCatch === 'function') {
        let flushed = false;
        let html = '';
        const componentTemplate = instance.render();
        renderTree(componentTemplate, config, Boolean(next))
            .subscribe(
                config.stream ? (value: string, flush?: boolean) => {
                    html += value;
                    if (flush && next) {
                        next(html, true);
                        html = '';
                        flushed = true;
                    }
                } : (value: string) => (html += value),
                e => {
                    if (flushed) {
                        throw e;
                    } else {
                        (instance.componentDidCatch as Function)(e);
                        render(instance.render(), config, next);
                    }
                },
                () => next && next(html)
            );
    } else {
        render(instance.render(), config, next);
    }
}

function renderStateless(template: Template<StatelessComponent<any>>, config: RenderServerConfig, next?: Next) {
    const componentType = template.componentType;
    const props = getComponentProps(template.props, template.children);
    render(componentType(props), config, next);
}

function renderUber(template: Template, config: RenderServerConfig, next?: Next) {
    switch (template.componentType) {
        case Flush:
            if (next && config.stream) {
                next('', true);
            }
            break;
        case Doctype:
            if (next) {
                next('<!DOCTYPE html>');
            }
            break;
    }
}

function renderArray(template: Renderable[], config: RenderServerConfig, next?: Next) {
    for (let i = 0, l = template.length; i < l; i++) {
        render(template[i], config, next);
    }
}
