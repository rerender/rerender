import { Store } from '../src/Store.js';

describe('Store', () => {
    describe('method setState', () => {
        let store;
        const state = {
            todos: {
                list: [
                    { id: 1, text: 'todo1' },
                    { id: 2, text: 'todo2' }
                ]
            }
        };

        beforeEach(() => {
            store = new Store({
                state
            });
        });

        it('should change full state if no path parameter', () => {
            expect(store.getState()).toEqual(state);
            store.setState({});
            expect(store.getState()).toEqual({});
        });

        it('should change partially state by path parameter', () => {
            store.setState([], ['todos', 'list']);
            expect(store.getState()).toEqual({
                todos: {
                    list: []
                }
            });
        });

        it('should change partially state by path parameter for non exists path', () => {
            store.setState({ id: 5 }, ['nonexist', 'path', 1]);
            expect(store.getState(['nonexist'])).toEqual({
                path: [undefined, {
                    id: 5
                }]
            });
        });

        it('should change partially state by path parameter for changed path', () => {
            store.setState([{ id: 4 }], ['todos', 'list']);
            expect(store.getState()).toEqual({
                todos: {
                    list: [
                        { id: 4 }
                    ]
                }
            });
            store.setState({ id: 5 }, ['todos', 'list', 1]);
            expect(store.getState()).toEqual({
                todos: {
                    list: [
                        { id: 4 },
                        { id: 5 }
                    ]
                }
            });
        });
    });

    describe('method getState', () => {
        let store;
        const state = {
            todos: {
                list: [
                    { id: 1, text: 'todo1' },
                    { id: 2, text: 'todo2' }
                ]
            }
        };

        beforeEach(() => {
            store = new Store({
                state
            });
        });

        it('should return full state if no path parameter', () => {
            expect(store.getState()).toBe(state);
        });

        it('should return partial state by path parameter', () => {
            expect(store.getState(['todos'])).toBe(state.todos);
            expect(store.getState(['todos', 'list'])).toBe(state.todos.list);
            expect(store.getState(['todos', 'list', 0])).toBe(state.todos.list[0]);
            expect(store.getState(['todos', 'list', 0, 'text'])).toBe(state.todos.list[0].text);
        });

        it('should return undefined on no exists path', () => {
            expect(store.getState(['todos', 'list', 1, 'text', 1])).toBe(undefined);
            expect(store.getState(['todos', 'list', 2])).toBe(undefined);
            expect(store.getState(['noexist', 'list', 'items', 5])).toBe(undefined);
        });
    });

    describe('immutability', () => {
        let store;
        const state = {
            todos: {
                list: [
                    { id: 1, text: 'todo1' },
                    { id: 2, text: 'todo2' }
                ]
            }
        };

        beforeEach(() => {
            store = new Store({
                state
            });
        });

        it('should replace state if no path parameter', () => {
            const newState = {
                todos: {}
            };
            store.setState(newState);
            expect(store.getState()).not.toBe(state);
            expect(store.getState()).toBe(newState);
        });

        it('should change state object by ref if no snapshot created', () => {
            const newState = {
                todos: {}
            };
            store.setState(newState);
            expect(store.getState()).not.toBe(state);
            expect(store.getState()).toBe(newState);
            const newList = [];
            store.setState(newList, ['todos', 'list']);
            expect(store.getState(['todos', 'list'])).toBe(newList);
            const muttable = store.getState();
            expect(muttable).not.toBe(newState);
            store.setState({}, ['todos']);
            expect(store.getState()).toBe(muttable);
            const snapshot = store.getStateSnapshot();
            expect(snapshot).toBe(muttable);
            store.setState([1], ['todos', 'list']);
            expect(store.getState()).toEqual({
                todos: {
                    list: [1]
                }
            });
            expect(store.getState()).not.toBe(snapshot);
        });
    });
});
