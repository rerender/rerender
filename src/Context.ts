import { DOMNode, Patch, Map, Renderable } from './types';
import { Template } from './Template';
import { Component } from './Component';
import { noop } from './noop';
import { TemplateFragment } from './TemplateFragment';

export class Context {
    constructor(
        public id: string,
        public parentDomNode: DOMNode | DocumentFragment,
        public nextDomIndex: { index: number },
        public next: (patch: Patch | Patch[]) => any = noop,
        public error: (error: Error) => any = noop,
        public parentComponent?: Component<any>,
        public currentPatch?: Patch,
    ) {}

    public incrementDom() {
        this.nextDomIndex.index++;
    }

    public addDomLevel(parentDomNode: DOMNode | DocumentFragment) {
        return this.cloneBy({
            parentDomNode,
            nextDomIndex: { index: 0 }
        });
    }

    public cloneBy(nextContext: Partial<Context>) {
        return new Context(
            nextContext.id || this.id,
            nextContext.parentDomNode || this.parentDomNode,
            nextContext.nextDomIndex || this.nextDomIndex,
            nextContext.next || this.next,
            nextContext.error || this.error,
            nextContext.parentComponent || this.parentComponent,
            'currentPatch' in nextContext
                ? nextContext.currentPatch === undefined
                    ? undefined
                    : nextContext.currentPatch
                : this.currentPatch
        );
    }
}
