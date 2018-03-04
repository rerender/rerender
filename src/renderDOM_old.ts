// import { ComponentClass, Map, Renderable, RenderDOMConfig, StatelessComponent } from './types';
// import { Component } from './Component';
// import { Channel } from './Channel';
// import { Observable } from './Observable';
// import { Template } from './Template';
// import { TemplateFragment } from './TemplateFragment';
//
// type DOMNode = HTMLElement | Document;
//
// type Patch = {
//     type: 'create' | 'move' | 'update' | 'remove',
//     parentDomNode: DOMNode,
//     id: string,
//     domIndex: number,
//     replace?: boolean,
//     domNode?: HTMLElement | DocumentFragment
// };
//
// export function renderDOM(
//     template: Renderable,
//     { window, domNode = window.document }: RenderDOMConfig = {}
// ) {
//     const channel = new Channel();
//     const rootContext = {
//         parentDomNode: domNode,
//         parentId: '',
//         nextIndex: 0,
//         nextDomIndex: 0
//     };
//
//     const patches: Patch[] = [];
//     renderTree(template, {
//         templatesById: {},
//         componentsById: {},
//         renderById: {}
//     }, rootContext)
//         .subscribe(
//             (patch: Patch) => patches.push(patch),
//             error => { throw error; },
//             () => {
//                 // apply patches
//             }
//         );
// }
//
// type RenderDOMOptions = {
//     templatesById: Map<Template>,
//     componentsById: Map<Component<any> | StatelessComponent<any>>,
//     renderById: Map<Renderable>
// };
//
// type Context = {
//     parentDomNode: DOMNode,
//     parentId: string,
//     parentComponent?: Component<any>,
//     nextIndex: number,
//     nextDomIndex: number,
//     insideCreation?: boolean,
//     noNeedKeys?: boolean
// };
//
// type Next = (patch: Patch) => any;
//
// function renderTree(
//     template: Renderable,
//     options: RenderDOMOptions,
//     context: Context
// ) {
//     return new Observable<Patch>((next, error, complete) => {
//         render(template, options, context, next);
//         complete();
//     });
// }
//
// function render(
//     template: Renderable,
//     options: RenderDOMOptions,
//     context: Context,
//     next: Next
// ) {
//     if (typeof template === 'object') {
//         if (template instanceof Template) {
//             if (typeof template.componentType === 'string') {
//                 return renderElement(template, options, context, next);
//             }
//         } else if (Array.isArray(template)) {
//             renderArray(template, options, context, next);
//         }
//     }
// }
//
// function renderElement(
//     template: Template<string>,
//     options: RenderDOMOptions,
//     context: Context,
//     prevTemplate: Template<string> = options.templatesById[context.id],
//     next: Next
// ) {
//     if (!prevTemplate) {
//         const domNode = document.createElement(template.componentType);
//         if (template.props) {
//             // TODO: setProps on domNode
//         }
//         if (context.insideCreation) {
//             context.parentDomNode.appendChild(domNode);
//         } else {
//             next({
//                 type: 'create',
//                 parentDomNode: context.parentDomNode,
//                 id,
//                 domIndex: context.nextDomIndex,
//                 replace: false,
//                 domNode
//             });
//         }
//         if (template.children) {
//             renderArray(template.children, options, {
//                 parentDomNode: domNode,
//                 parentId: id,
//                 parentComponent: context.parentComponent,
//                 nextDomIndex: 0,
//                 nextIndex: 0,
//                 insideCreation: true,
//                 noNeedKeys: true
//             }, next);
//         }
//     }
// }
//
// function renderArray(
//     template: Renderable[],
//     options: RenderDOMOptions,
//     context: Context,
//     next: Next
// ) {
//
// }
//
// function getElementId(template: Template<string>, context: Context) {
//     const { componentType, props } = template;
//     if (props) {
//         if (props.uniqid) {
//             return 'u:' + props.uniqid + ':' + componentType;
//         } else if (props.key) {
//             return context.parentId + '.k:' + props.key + ':' + componentType;
//         }
//     }
//
//     return context.parentId + '.' + context.nextDomIndex + ':' + componentType;
// }
//
// // TODO: add componentType info in id
// function getComponentId(
//     template: Template<ComponentClass | StatelessComponent<any>>,
//     context: Context
// ) {
//     const { componentType, props } = template;
//     if (props) {
//         if (props.uniqid) {
//             return 'cu:' + props.uniqid;
//         } else if (props.key) {
//             return context.parentId + '.ck:' + props.key;
//         }
//     }
//
//     return context.parentId + '.c:' + context.nextDomIndex;
// }
