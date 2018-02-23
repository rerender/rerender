/* tslint:disable:member-access max-classes-per-file */
import { h, Component } from '../src/';
import { StatelessComponent } from '../src/types';
import { renderToString } from '../src/renderServer';
import { Fragment } from '../src/Fragment';
import { Doctype } from '../src/uberComponents';
import { concatStyle } from '../src/concatStyle';

describe('renderServer', () => {
    it('should stringify element with props and children', () => {
        expect(renderToString(
            <div class='block' id={'id1'} style={concatStyle({
                color: 'black',
                backgroundColor: 'white',
                MozTransform: 'rotate(30deg)',
                WebkitTransform: 'rotate(30deg)',
                transform: 'rotate(30deg)'
            })}>
                <input checked value={'some value'} />
            </div>)
        ).toEqual('<div class="block" id="id1" style="' +
                'color:black;background-color:white;-moz-transform:rotate(30deg);' +
                '-webkit-transform:rotate(30deg);transform:rotate(30deg);' +
            '"><input checked value="some value"></input></div>');
    });

    it('should stringify stateless component', () => {
        type Props = {
            id: string
        };
        const Block: StatelessComponent<Props> = ({ children, id }) => <div class='block' id={id}>
            <input checked value={'some value'} />
            {children}
        </div>;

        expect(renderToString(<Block id='id1'>some text</Block>))
            .toEqual('<div class="block" id="id1"><input checked value="some value"></input>some text</div>');
    });

    it('should stringify Component', () => {
        type Props = {
            id: string
        };

        class Block extends Component<Props> {
            render() {
                const { children, id } = this.props;

                return <div class='block' id={id}>
                    <input checked value={'some value'} />
                    {children}
                </div>;
            }
        }

        expect(renderToString(<Block id='id1'>some text</Block>))
            .toEqual('<div class="block" id="id1"><input checked value="some value"></input>some text</div>');
    });

    it('should support Doctype and Fragment', () => {
        expect(renderToString(<Fragment>
            <Doctype />
            <html>
                <head>
                    <title>{'Text of title'}</title>
                </head>
                <body>
                    <div class='main' />
                </body>
            </html>
        </Fragment>))
            .toEqual('<!DOCTYPE html><html><head><title>Text of title</title></head>' +
                '<body><div class="main"></div></body></html>');
    });
});
