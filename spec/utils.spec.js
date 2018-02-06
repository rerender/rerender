import { deepEqual, shallowClone, memoizeLast, shallowEqual } from '../src/utils';

describe('utils', () => {
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

    describe('deepEqual', () => {
        const tests = [
            [0, 0, true],
            [0, 1, false],
            [1, 0, false],
            ['', '', true],
            ['', 'r', false],
            ['r', '', false],
            ['re', 're', true],
            ['re', 'we', false],
            ['we', 're', false],
            [null, null, true],
            [null, undefined, false],
            [undefined, null, false],
            [false, false, true],
            [true, true, true],
            [true, false, false],
            [false, true, false],
            [false, null, false],
            [null, false, false],
            [{}, {}, true],
            [{ a: 1 }, { a: 1 }, true],
            [{ a: 1 }, { b: 1 }, false],
            [{ b: 1 }, { a: 1 }, false],
            [{ a: { b: 1 } }, { a: { b: 1 } }, true],
            [{ b: { a: 1 } }, { a: { b: 1 } }, false],
            [{ a: { b: 1 } }, { a: { b: 2 } }, false],
            [[0, 1], [0, 1], true],
            [[0, 1], [1], false],
            [[0, 1], [1, 0], false],
            [[{ a: 1 }, { b: 2 }], [{ a: 1 }, { b: 2 }], true],
            [[{ a: 1 }, { b: 2 }], [{ a: 1 }, { b: 2 }, { c: 3 }], false],
            [[{ a: 1 }, { b: 2 }], [{ a: 1 }, { b: 3 }], false],
            [{
                a: {
                    b: 2,
                    c: {
                        d: 4
                    }
                }
            }, {
                a: {
                    b: 2,
                    c: {
                        d: 4
                    }
                }
            }, true],
            [{
                a: {
                    b: 2,
                    c: {
                        d: '4'
                    }
                }
            }, {
                a: {
                    b: 2,
                    c: {
                        d: 4
                    }
                }
            }, false]
        ];

        const runTests = (tests) => {
            tests.forEach(([one, two, same]) => {
                it (`in case deepEqual(${JSON.stringify(one)}, ${JSON.stringify(two)}) must return ${same}.`, () => {
                    expect(deepEqual(one, two) === same).toBe(true);
                });
            });
        };

        runTests(tests);
    });

    describe('memoizeLast', () => {
        it('should work without config', () => {
            const fn = value => ({ value });
            const memoized = memoizeLast(fn);
            const result1 = memoized('a');
            const result2 = memoized('a');
            const result3 = memoized('b');
            const result4 = memoized('b');
            const result5 = memoized('b');

            expect(result1).toEqual({ value: 'a' });
            expect(result1).toBe(result2);
            expect(result3).toEqual({ value: 'b' });
            expect(result3).toBe(result4);
            expect(result3).toBe(result5);
        });

        it('should work with equalityFunctions', () => {
            const fn = (value1, value2, obj) => ({ value1, value2, obj });
            const memoized = memoizeLast(fn, [undefined, undefined, shallowEqual]);
            const result1 = memoized('a', 'b', { c: 'd' });
            const result2 = memoized('a', 'b', { c: 'd' });

            expect(result1).toEqual({
                value1: 'a',
                value2: 'b',
                obj: {
                    c: 'd'
                }
            });
            expect(result1).toBe(result2);
        });

        it('should not execute function if initialValues parameter equals firstValues', () => {
            let callsCount = 0;
            const fn = (value1, value2, obj) => {
                callsCount++;
                return { value1, value2, obj };
            };
            const memoized = memoizeLast(fn, [undefined, undefined, shallowEqual], [ 'a', 'b', { c: 'd' } ]);

            memoized('a', 'b', { c: 'd' });
            expect(callsCount).toBe(0);
            memoized('a', 'b', { c: 'e' });
            expect(callsCount).toBe(1);
        });
    });
});
