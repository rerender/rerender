import { ComponentType, Map, Children, RenderableArray } from './types';
import { TemplateFragment } from './TemplateFragment';

export class Template {
    constructor(
        public componentType: ComponentType,
        public props?: Map<any> | null,
        public children?: Children
    ) {}
}
