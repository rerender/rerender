/* tslint:disable:member-access max-classes-per-file */
import { h, Component } from '../src/';
import { Flush } from '../src/uberComponents';
import { StatelessComponent } from '../src/types';
import { renderServer } from '../src/renderServer';
import { renderToString } from '../src/renderToString';
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
                    {this.props.children}
                </div>;
            }
        }
        expect(renderToString(<Guard>text</Guard>))
            .toBe('<div class="normal">text</div>');

        expect(renderToString(<Guard><Buggy /></Guard>))
            .toBe('<div class="error">Sorry, something went wrong: Error!</div>');

        expect(renderToString(<Guard><Guard><Buggy /></Guard></Guard>))
            .toBe('<div class="normal"><div class="error">Sorry, something went wrong: Error!</div></div>');
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

    it('should render namespaced element and attributes', () => {
        expect(renderToString(
            <div>
                {h('svg:svg', {
                    'xmlns:xlink': 'http://www.w3.org/1999/xlink',
                    'xmlns:ev': 'http://www.w3.org/2001/xml-events',
                    'width': '100%',
                    'height': '100%'
                },
                    <rect fill='white' x='0' y='0' width='100%' height='100%' />,
                    <rect fill='silver' x='0' y='0' width='100%' height='100%' rx='1em'/>
                )}
            </div>
        )).toBe(
            '<div><svg:svg ' +
                'xmlns:xlink="http://www.w3.org/1999/xlink" ' +
                'xmlns:ev="http://www.w3.org/2001/xml-events" ' +
                'width="100%" ' +
                'height="100%"' +
            '>' +
                '<rect fill="white" x="0" y="0" width="100%" height="100%"></rect>' +
                '<rect fill="silver" x="0" y="0" width="100%" height="100%" rx="1em"></rect>' +
            '</svg:svg></div>'
        );
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
        expect(mock.next.calls.argsFor(0)).toEqual(['<div class="container"><div class="header">Header</div>', true]);
        expect(mock.next.calls.argsFor(1)).toEqual(['<div class="body">Body</div>', true]);
        expect(mock.next.calls.argsFor(2)).toEqual(['<div class="footer">Footer</div></div>', undefined]);
        expect(mock.error).not.toHaveBeenCalled();
        expect(mock.complete).toHaveBeenCalledTimes(1);
    });
});
