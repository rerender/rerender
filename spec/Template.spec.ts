import { Template } from '../src/Template';
import { Fragment } from '../src/Fragment';

describe('Template', () => {
    it('should create object with componentType, props and children', () => {
        const template = new Template('div', { className: 'block' }, ['text of div']);
        expect(template.componentType).toBe('div');
        expect(template.props).toEqual({ className: 'block' });
        expect(template.children).toEqual(['text of div']);
    });
});
