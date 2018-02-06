import { Promise } from '../src/Promise';

let string = '';

describe('Promise', () => {
    it('should support basic functionality', () => {
        var p1 = new Promise(function(resolve) { resolve('foo'); });
        var p2 = new Promise(function(resolve, reject) { reject('quux'); });
        var score = 0;

        function thenFn(result)  { score += (result === 'foo'); }
        function catchFn(result) { score += (result === 'quux'); }
        function shouldNotRun()  { score = -Infinity; }

        p1.then(thenFn, shouldNotRun);
        p2.then(shouldNotRun, catchFn);
        p1.catch(shouldNotRun);
        p2.catch(catchFn);

        p1.then(function() {
            // Promise.prototype.then() should return a new Promise
            score += p1.then() !== p1;
        });

        expect(score).toBe(4);
    });

    it('should call callbacks after resolving', () => {
        let callback1;
        let callback2;
        let callback3;

        (new Promise(resolve => {
            setTimeout(() => resolve(1), 0);
        }))
            .then(value => {
                callback1 = value;
                return 2;
            })
            .then(value => {
                callback2 = value;
                return 3;
            })
            .then(value => {
                callback3 = value;
                check();
            });

        function check() {
            expect(callback1).toBe(1);
            expect(callback2).toBe(2);
            expect(callback3).toBe(3);
        }
    });

    it('should call callbacks for already resolved promise', () => {
        let callback1;
        let callback2;
        let callback3;

        Promise.resolve(1)
            .then(value => {
                callback1 = value;
                return 2;
            })
            .then(value => {
                callback2 = value;
                return 3;
            })
            .then(value => {
                callback3 = value;
            });

        expect(callback1).toBe(1);
        expect(callback2).toBe(2);
        expect(callback3).toBe(3);
    });

    it('should work sync', () => {
        Promise.resolve('hello').then(payload => {
            string += payload + ' ';
        });
        string += 'world!';

        expect(string).toBe('hello world!');
    });
});
