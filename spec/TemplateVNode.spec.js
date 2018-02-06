// import TemplateVNode, { stringifyAttr } from '../src/TemplateVNode';
//
// describe('server TemplateVNode', () => {
//     describe('stringifyAttr', () => {
//         it('should return attr string for id', () => {
//             expect(stringifyAttr('id', 'block')).toBe(' id="block"');
//         });
//
//         it('should return attr string for className', () => {
//             expect(stringifyAttr('className', 'block')).toBe(' class="block"');
//         });
//
//         it('should return attr string for dataset', () => {
//             expect(stringifyAttr('dataset', { id: 'id1', name: 'name1' })).toBe(' data-id="id1" data-name="name1"');
//         });
//
//         it('should return attr string for style', () => {
//             expect(stringifyAttr('style', { borderRightColor: 'red', border: '0 none' })).toBe(' style="border-right-color: red;border: 0 none;"');
//         });
//
//         it('should return empty string for event attr', () => {
//             expect(stringifyAttr('onClick', () => {})).toBe('');
//         });
//     });
//
//     describe('method renderServer', () => {
//         it('should render p to string', () => {
//             const template = new TemplateVNode('p', { className: 'block' }, []);
//
//             expect(template.renderServer({})).toBe('<p class="block"></p>');
//         });
//
//         it('should render text items', () => {
//             const template = new TemplateVNode('p', null, ['text 1;', 'another text']);
//
//             expect(template.renderServer({})).toBe('<p>text 1;another text</p>');
//         });
//
//         it('should render components items', () => {
//             const children1 = new TemplateVNode('span', null, 'text 1');
//             const children2 = new TemplateVNode('span', null, 'text 2');
//             const template = new TemplateVNode('p', null, [children1, children2]);
//
//             expect(template.renderServer({})).toBe('<p><span>text 1</span><span>text 2</span></p>');
//         });
//
//         it('should render components in one array', () => {
//             const children1 = new TemplateVNode('span', null, 'text 1');
//             const children2 = new TemplateVNode('span', null, 'text 2');
//             const template = new TemplateVNode('p', null, [[children1, children2], 'text']);
//
//             expect(template.renderServer({})).toBe('<p><span>text 1</span><span>text 2</span>text</p>');
//         });
//
//         it('should escape special symbols', () => {
//             const children1 = new TemplateVNode('span', null, 'text < 1');
//             const children2 = new TemplateVNode('span', null, 'text > 2');
//             const template = new TemplateVNode('p', null, [children1, children2, 'text > me;', '&', ['array >', 'array <', 'array value with &amp;']]);
//
//             expect(template.renderServer({})).toBe('<p><span>text &lt; 1</span><span>text &gt; 2</span>text &gt; me;&amp;array &gt;array &lt;array value with &amp;amp;</p>');
//         });
//
//         it('should render void tag to string', () => {
//             const template = new TemplateVNode('input', {
//                 name: 'name1',
//                 id: 'id1'
//             }, []);
//
//             expect(template.renderServer({})).toBe('<input name="name1" id="id1" />');
//         });
//
//         it('should render p with childrens', () => {
//             const template = new TemplateVNode('p', { className: 'block' }, [
//                 'text 1',
//                 'text 2'
//             ]);
//
//             expect(template.renderServer({})).toBe('<p class="block">text 1text 2</p>');
//         });
//     });
// });
