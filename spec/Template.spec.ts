import { Template } from '../src/Template';
import { Fragment } from '../src/Fragment';

describe('Template', () => {
    it('should return isElement true for componentType string', () => {
        expect((new Template('div')).isElement).toBe(true);
        expect((new Template('div')).isComponent).toBe(undefined);
        expect((new Template('div')).isFragment).toBe(undefined);
    });

    it('should return isFragment true for componentType Fragment', () => {
        expect((new Template(Fragment)).isFragment).toBe(true);
        expect((new Template(Fragment)).isComponent).toBe(undefined);
        expect((new Template(Fragment)).isElement).toBe(undefined);
    });

    it('should return isComponent true for componentType Function', () => {
        const Block = () => {};
        expect((new Template(Block)).isComponent).toBe(true);
        expect((new Template(Block)).isElement).toBe(undefined);
        expect((new Template(Block)).isFragment).toBe(undefined);
    });
});
