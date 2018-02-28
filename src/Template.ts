import { ComponentType, Map, Renderable, RenderableArray } from './types';
import { TemplateFragment } from './TemplateFragment';

export class Template<T = any> {
    constructor(
        public componentType: T,
        public props?: Map<any> | null,
        public children?: Renderable[]
    ) {}
}
