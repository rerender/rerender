import { Context } from '../src/Context';

describe('Context', () => {
    let context1;
    let context2;

    beforeEach(() => {
        context1 = new Context({
            isDomNode: false,
            parentId: 'r.c0',
            parentNodeId: 'r',
            index: 0,
            parentPosition: '',
            domIndex: 0,
            parent: { type: 'c' },
            parentNode: { type: 'n' }
        });
        context2 = new Context({
            isDomNode: true,
            parentId: 'r.c0',
            parentNodeId: 'r',
            index: 0,
            parentPosition: '',
            domIndex: 0,
            parent: { type: 'c' },
            parentNode: { type: 'n' }
        });
    });

    describe('new instance', () => {
        it('should calc id, position and domId', () => {
            expect(context1.id).toBe('r.c0.c0');
            expect(context1.position).toBe(undefined);
            expect(context1.domId).toBe(undefined);

            expect(context2.id).toBe('r.c0.0');
            expect(context2.position).toBe('.childNodes[0]');
            expect(context2.domId).toBe(undefined);
        });
    });

    describe('method addIdLevel', () => {
        it('should return new context', () => {
            const newParent = { type: 'c' };
            const prevParent = context1.parent;
            const context1a = context1.addIdLevel(newParent);

            expect(context1.getParent()).toBe(prevParent);
            expect(context1a.getParent()).toBe(newParent);
        });
    });

    describe('method addDomLevel', () => {
        it('should return new context', () => {
            const newParentNode = { type: 'n' };
            const prevParentNode = context1.parentNode;
            const context1a = context1.addDomLevel(newParentNode);

            expect(context1.getParentNode()).toBe(prevParentNode);
            expect(context1a.getParentNode()).toBe(newParentNode);
        });
    });

    describe('method incrementComponent', () => {
        it('should return new context', () => {
            const context1a = context1.incrementComponent();

            expect(context1a.id).toBe('r.c0.c0');
            expect(context1.index).toBe(1);
        });

        it('should fix uniqid in id', () => {
            const context1a = context1.incrementComponent(null, 'uniq1');

            expect(context1a.id).toBe('uniq1');
        });

        it('should fix key in id', () => {
            const context1a = context1.incrementComponent('key1');

            expect(context1a.id).toBe('r.c0.kkey1');
        });
    });

    describe('method incrementDom', () => {
        it('should return new context', () => {
            const context1a = context1.incrementDom();

            expect(context1a.id).toBe('r.c0.0');
            expect(context1a.position).toBe('.childNodes[0]');
            expect(context1a.domId).toBe(undefined);
            expect(context1.index).toBe(1);
        });

        it('should fix uniqid in id', () => {
            const context1a = context1.incrementDom(null, 'uniq1');

            expect(context1a.id).toBe('uniq1');
            expect(context1a.position).toBe('.childNodes[0]');
            expect(context1a.domId).toBe('r.childNodes[0]');
        });

        it('should fix key in id', () => {
            const context1a = context1.incrementDom('key1');

            expect(context1a.id).toBe('r.c0.kkey1');
            expect(context1a.position).toBe('.childNodes[0]');
            expect(context1a.domId).toBe('r.childNodes[0]');
        });
    });

    describe('domId calculation', () => {
        it('should work in dom methods case', () => {
            let context;
            let contextLevel;
            contextLevel = context1.addDomLevel({}, 'r.c0.c0.1');

            contextLevel.incrementDom();
            contextLevel.incrementDom();
            context = contextLevel.incrementDom('key1');

            expect(context.id).toBe('r.c0.c0.kkey1');
            expect(context.position).toBe('.childNodes[2]');
            expect(context.domId).toBe('r.c0.c0.1.childNodes[2]');

            contextLevel = context.addDomLevel({});
            context = contextLevel.incrementDom(null, 'uniq1');
            expect(context.id).toBe('uniq1');
            expect(context.position).toBe('.childNodes[2].childNodes[0]');
            expect(context.domId).toBe('r.c0.c0.kkey1.childNodes[0]');
        });

        it('should inherit key and uniqid of parent component', () => {
            let context;
            let contextLevel;

            contextLevel = context1.addDomLevel({});
            contextLevel.incrementDom();
            context = contextLevel.incrementDom();
            contextLevel = context.addIdLevel({});
            context = contextLevel.incrementComponent('key1');
            contextLevel = context.addDomLevel({}, 'r.c0.c0.1');
            context = contextLevel.incrementDom();

            expect(context.id).toBe('r.c0.c0.1.kkey1.0');
            expect(context.position).toBe('.childNodes[1].childNodes[0]');
            expect(context.parentNodeId).toBe('r.c0.c0.1');
            expect(context.domId).toBe('r.c0.c0.1.childNodes[0]');
        });
    });
});
