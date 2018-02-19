import { shallowClone } from '../src/shallowClone';

describe('shallowClone', () => {
    it('should create shallow clone of object', () => {
        const object = {
            id: 1,
            z: {
                x: 'y'
            }
        };
        const clone = shallowClone(object);
        expect(clone).not.toBe(object);
        expect(clone.id).toBe(object.id);
        expect(clone.z).toBe(object.z);
    });

    it('should create shallow clone of array', () => {
        const array = [
            1,
            { x: 'y' }
        ];
        const clone = shallowClone(array);
        expect(clone).not.toBe(array);
        expect(Array.isArray(clone)).toBe(true);
        expect(clone[0]).toBe(array[0]);
        expect(clone[1]).toBe(array[1]);
    });
});
