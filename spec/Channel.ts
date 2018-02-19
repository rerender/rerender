import { Channel } from '../src/Channel';

let channel: Channel;

describe('Channel', () => {
    beforeEach(() => {
        channel = new Channel();
    });

    it('should work subscription', () => {
        const mock = jasmine.createSpyObj('mock', ['event1Handler', 'event1HandlerAnother', 'event2Handler']);
        const payload1 = {
            something: true
        };
        const payload2 = 'payload2';

        channel.on('event1', mock.event1Handler);
        channel.on('event1', mock.event1HandlerAnother);
        channel.on('event2', mock.event2Handler);

        channel.emit('event1', payload1);
        expect(mock.event1Handler).toHaveBeenCalledTimes(1);
        expect(mock.event1Handler).toHaveBeenCalledWith(payload1);
        expect(mock.event1HandlerAnother).toHaveBeenCalledTimes(1);
        expect(mock.event1HandlerAnother).toHaveBeenCalledWith(payload1);

        channel.emit('event1', payload2);
        expect(mock.event1Handler).toHaveBeenCalledTimes(2);
        expect(mock.event1Handler).toHaveBeenCalledWith(payload2);
        expect(mock.event1HandlerAnother).toHaveBeenCalledTimes(2);
        expect(mock.event1HandlerAnother).toHaveBeenCalledWith(payload2);

        channel.emit('event2', false);
        expect(mock.event1Handler).toHaveBeenCalledTimes(2);
        expect(mock.event1HandlerAnother).toHaveBeenCalledTimes(2);
        expect(mock.event2Handler).toHaveBeenCalledTimes(1);
        expect(mock.event2Handler).toHaveBeenCalledWith(false);
    });

    it('should correctly work with unknown event', () => {
        const mock = jasmine.createSpyObj('mock', ['eventHandler']);

        channel.on('event', mock.eventHandler);
        channel.emit('unknown', true);

        expect(mock.eventHandler).toHaveBeenCalledTimes(0);
    });

    it('should correctly work with double adding handler', () => {
        const mock = jasmine.createSpyObj('mock', ['eventHandler']);

        channel.on('event', mock.eventHandler);
        channel.on('event', mock.eventHandler);
        channel.emit('event', true);

        expect(mock.eventHandler).toHaveBeenCalledTimes(1);
    });

    it('should unsubsribe only one listener', () => {
        const mock = jasmine.createSpyObj('mock', ['eventHandler', 'eventHandlerAnother']);
        channel.un('event', mock.eventHandler);

        channel.on('event', mock.eventHandler);
        channel.on('event', mock.eventHandlerAnother);
        channel.emit('event', true);

        expect(mock.eventHandler).toHaveBeenCalledTimes(1);
        expect(mock.eventHandlerAnother).toHaveBeenCalledTimes(1);

        channel.un('event', mock.eventHandler);
        channel.emit('event', true);
        expect(mock.eventHandler).toHaveBeenCalledTimes(1);
        expect(mock.eventHandlerAnother).toHaveBeenCalledTimes(2);
    });

    it('should unsubsribe all listeners', () => {
        const mock = jasmine.createSpyObj('mock', ['eventHandler', 'eventHandlerAnother']);

        channel.on('event', mock.eventHandler);
        channel.on('event', mock.eventHandlerAnother);
        channel.emit('event', true);

        expect(mock.eventHandler).toHaveBeenCalledTimes(1);
        expect(mock.eventHandlerAnother).toHaveBeenCalledTimes(1);

        channel.un('event');
        channel.emit('event', true);
        expect(mock.eventHandler).toHaveBeenCalledTimes(1);
        expect(mock.eventHandlerAnother).toHaveBeenCalledTimes(1);
    });
});
