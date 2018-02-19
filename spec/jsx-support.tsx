import { h } from '../src/index';

describe('jsx', () => {
    it('should create Template with componentType, props and children', () => {
        const template = <div className='block'>text of div</div>;
        expect(template.componentType).toBe('div');
        expect(template.props).toEqual({ className: 'block' });
        expect(template.children).toEqual(['text of div']);
    });
});
