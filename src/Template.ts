import { ComponentType, Map, Renderable, RenderableArray } from './types';
import { TemplateFragment } from './TemplateFragment';

export class Template {
    constructor(
        public componentType: ComponentType,
        public props?: Map<any> | null,
        public children?: Renderable[]
    ) {}
}
