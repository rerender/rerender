import { ComponentType, Map, Children, RenderableArray } from './types';
import { Fragment } from './Fragment';

export class Template {
    public isElement?: boolean;
    public isComponent?: boolean;
    public isFragment?: boolean;

    constructor(
        public componentType: ComponentType,
        public props?: Map<any> | null,
        public children?: Children
    ) {
        if (typeof componentType === 'string') {
            this.isElement = true;
        } else if (componentType === Fragment) {
            this.isFragment = true;
        } else {
            this.isComponent = true;
        }
    }
}
