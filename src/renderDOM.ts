import { ComponentClass, Map, Renderable, RenderDOMConfig, StatelessComponent } from './types';
import { shallowEqualProps } from './shallowEqualProps';
import { Component } from './Component';
import { Channel } from './Channel';
import { Observable } from './Observable';
import { Template } from './Template';
import { TemplateFragment } from './TemplateFragment';

type DOMNode = HTMLElement | Document;

type Patch = {
    type: 'create' | 'move' | 'update' | 'remove',
    parentDomNode: DOMNode,
    id: string,
    domIndex: number,
    replace?: boolean,
    domNode?: HTMLElement | DocumentFragment
};

type Context = {
    id: string,
    parentDomNode: DOMNode,
    templateIndex: number,
    nextDomIndex: number
};

type Instance = {
    component?: Component<any>,
    state?: any,
    render: Renderable
};

type RenderDOMOptions = {
    templatesById: Map<Renderable>,
    instancesById: Map<Instance>,
    nextTemplatesById: Map<Renderable>,
    nextInstancesById: Map<Instance>
};

function patching(
    template: Renderable,
    prevTemplateByPosition: Renderable,
    context: Context,
    options: RenderDOMOptions
) {
    const prevTemplateById = options.templatesById[context.id];
    if (template) {
        if (!prevTemplateById) {
            if (!prevTemplateByPosition) {
                // create
            } else {
                // create and replace
            }
        } else {
            if (!prevTemplateByPosition) {
                // move
            } else if (prevTemplateById !== prevTemplateByPosition) {
                // move and replace
            }
        }
        if (template instanceof Template) {

        }
    } else {
        if (prevTemplateById) {
            // destroy id
        }
        if (prevTemplateByPosition) {
            // remove another instance or moved
        }
    }
 }
