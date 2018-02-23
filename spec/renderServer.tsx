/* tslint:disable:member-access max-classes-per-file */
import { h, Component } from '../src/';
import { Flush } from '../src/uberComponents';
import { StatelessComponent } from '../src/types';
import { renderToString, renderServer } from '../src/renderServer';
import { Fragment } from '../src/Fragment';
import { Doctype } from '../src/uberComponents';
import { concatStyle } from '../src/concatStyle';

describe('renderToString', () => {
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

    it('should work componentDidCatch', () => {
        const Buggy: StatelessComponent<{}> = () => {
            throw new Error('Error!');
        };
        type State = { error?: string };
        class Guard extends Component<{}, State> {
            state: State = {};

            componentDidCatch(error: Error) {
                this.setState({
                    error: error.message
                });
            }

            render() {
                if (this.state.error) {
                    return <div class='error'>Sorry, something went wrong: {this.state.error}</div>;
                }

                return <div class='normal'>
                    <Buggy />
                </div>;
            }
        }
        expect(renderToString(<Guard />)).toBe('<div class="error">Sorry, something went wrong: Error!</div>');
    });

    it('should work dangerousInnerHtml without children', () => {
        const script = 'const a = true; const b = "1"; const c = a && b;console.log(a < b);';
        expect(renderToString(<script type='text/javascript' dangerousInnerHtml={script} />))
            .toBe('<script type="text/javascript">' + script + '</script>');
    });

    it('should not work dangerousInnerHtml if children present', () => {
        const script = 'const a = true; const b = "1"; const c = a && b;console.log(a < b);';
        expect(renderToString(<script type='text/javascript' dangerousInnerHtml={script}>{'a < b; a && b;'}</script>))
            .toBe('<script type="text/javascript">a &lt; b; a &amp;&amp; b;</script>');
    });
});

describe('renderServer', () => {
    it('should work streaming', () => {
        const mock = jasmine.createSpyObj('mock', ['next', 'error', 'complete']);
        renderServer(
            <div class='container'>
                <div class='header'>Header</div>
                <Flush />
                <div class='body'>Body</div>
                <Flush />
                <div class='footer'>Footer</div>
            </div>,
            { stream: true }
        ).subscribe(mock.next, mock.error, mock.complete);

        expect(mock.next).toHaveBeenCalledTimes(3);
        expect(mock.next.calls.argsFor(0)).toEqual(['<div class="container"><div class="header">Header</div>']);
        expect(mock.next.calls.argsFor(1)).toEqual(['<div class="body">Body</div>']);
        expect(mock.next.calls.argsFor(2)).toEqual(['<div class="footer">Footer</div></div>']);
        expect(mock.error).not.toHaveBeenCalled();
        expect(mock.complete).toHaveBeenCalledTimes(1);
    });
});
