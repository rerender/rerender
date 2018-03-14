import {
    DOMNode,
    Patch,
    PatchCreate,
    PatchUpdate,
    PatchMove,
    PatchRemove,
    Map,
    Renderable
} from './types';
import { Template } from './Template';
import { Component } from './Component';
import { noop } from './noop';
import { TemplateFragment } from './TemplateFragment';

export class Context {
    constructor(
        public id: string,
        public parentDomNodeId: string,
        public parentPatch?: Patch,
        public next: (patch: Patch | Patch[]) => any = noop,
        public error: (error: Error) => any = noop,
        public parentComponent?: Component<any>,
        public insideCreation?: boolean,
        public insideMove?: boolean,
        public insideRemove?: boolean
    ) {}

    public cloneBy(nextContext: Partial<Context>) {
        const {
            insideCreation = this.insideCreation,
            insideMove = this.insideMove,
            insideRemove = this.insideRemove
        } = nextContext;

        return new Context(
            nextContext.id || this.id,
            nextContext.parentDomNodeId || this.parentDomNodeId,
            nextContext.parentPatch || this.parentPatch,
            nextContext.next || this.next,
            nextContext.error || this.error,
            nextContext.parentComponent || this.parentComponent,
            insideCreation,
            insideMove,
            insideRemove
        );
    }
}
