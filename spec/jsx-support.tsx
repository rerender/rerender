/* tslint:disable:member-access max-classes-per-file */
import { h } from '../src/index';
import { Component } from '../src/Component';
import { StatelessComponent } from '../src/types';

describe('jsx', () => {
    it('should create Template with componentType: string, props and children', () => {
        const template = <div className='block'>text of div</div>;
        expect(template.componentType).toBe('div');
        expect(template.props).toEqual({ className: 'block' });
        expect(template.children).toEqual(['text of div']);
    });

    it('should create Template with componentType: Component, props and children', () => {
        type Props = {
            value: number
            valueOptional?: string
        };

        const defaultProps = {
            valueOptional: 'some default string'
        };

        class Block extends Component<Props, void, typeof defaultProps> {
            static defaultProps = defaultProps;
            public children: string;

            render() {
                const { value, valueOptional } = this.props;

                return <div>{valueOptional.trim()}</div>;
            }
        }

        const template = <Block value={1}>text of block</Block>;
        expect(template.componentType).toBe(Block);
        expect(template.props).toEqual({ value: 1 });
        expect(template.children).toEqual(['text of block']);
    });

    it('should create Template with componentType: StatelessComponent, props and children', () => {
        type Props = {
            value: number
            valueOptional?: string
        };

        const Block: StatelessComponent<Props> = ({ value, valueOptional = 'some default string' }) =>
            <div>{valueOptional.trim()}</div>;

        const template = <Block value={1}>text of block</Block>;
        expect(template.componentType).toBe(Block);
        expect(template.props).toEqual({ value: 1 });
        expect(template.children).toEqual(['text of block']);
    });
});
