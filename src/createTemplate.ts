import { Template } from './Template';
import { Fragment } from './Fragment';
import { TemplateFragment } from './TemplateFragment';
import { ComponentType, Map, Renderable } from './types';
import { Controllers } from './Controllers';

export type CreateTemplateSignature = (
    componentType: ComponentType,
    props?: null | Map<any>,
    ...children: Renderable[]
) => Template;

export const createTemplate: CreateTemplateSignature = function(componentType, props) {
    const length = arguments.length;
    let children: Renderable[] | undefined;

    if (length > 2) {
        children = Array(length - 2);

        for (let i = 2; i < length; i++) {
            children[i - 2] = arguments[i];
        }
    }

    if (props && props.controller) {
        return new Template(Controllers, { ...props, targetComponentType: componentType }, children);
    }

    return new Template(componentType, props, children);
};
