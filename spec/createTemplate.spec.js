import { createTemplate } from '../src/createTemplate';
import { TemplateVNode } from '../src/TemplateVNode';
import { TemplateComponent } from '../src/TemplateComponent';
import { TemplateComponentStateless } from '../src/TemplateComponentStateless';
import { TemplateFragment } from '../src/TemplateFragment';
import { Component } from '../src/Component';

describe('createTemplate', () => {
    it('should return instance of TemplateVNode', () => {
        const props = { id: 'id1' };
        const template = createTemplate('p', props, 'text', 'another text');

        expect(template instanceof TemplateVNode).toBe(true);
        expect(template.tag).toBe('p');
        expect(template.attrs).toEqual(props);
        expect(template.children).toEqual(['text', 'another text']);
    });

    it('should work with null attrs and children', () => {
        const template = createTemplate('p', null, null);

        expect(template.attrs).toBe(null);
        expect(template.children).toBe(null);
    });

    it('should work with undefined attrs', () => {
        const template = createTemplate('p');

        expect(template.attrs).toBe(null);
        expect(template.children).toBe(null);
    });

    it('should return instance of TemplateComponent', () => {
        const props = { id: 'id1' };
        class Block extends Component {}
        const template = createTemplate(Block, props, 'text', 'another text');

        expect(template instanceof TemplateComponent).toBe(true);
        expect(template.props).toEqual(Object.assign({}, props, { children: new TemplateFragment(['text', 'another text']) }));
    });

    it('should work with null props and children for components', () => {
        class Block extends Component {}
        const template = createTemplate(Block, null, null);

        expect(template instanceof TemplateComponent).toBe(true);
        expect(template.props).toEqual({ children: null });
    });

    it('should work with undefined props and children for components', () => {
        class Block extends Component {}
        const template = createTemplate(Block);

        expect(template instanceof TemplateComponent).toBe(true);
        expect(template.props).toEqual({ children: null });
    });

    it('should return instance of TemplateComponentStateless', () => {
        const props = { id: 'id1' };
        const template = createTemplate(function() {}, props, 'text', 'another text');

        expect(template instanceof TemplateComponentStateless).toBe(true);
        expect(template.props).toEqual(Object.assign({}, props, { children: new TemplateFragment(['text', 'another text']) }));
    });

});
