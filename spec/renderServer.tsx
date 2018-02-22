import { h } from '../src/';
import { StatelessComponent } from '../src/types';
import { renderServer } from '../src/renderServer';

describe('renderServer', () => {
    it('should stringify element with props and children', () => {
        expect(renderServer(
            <div class='block' id={'id1'}>
                <input checked value={'some value'} />
            </div>, {})
        ).toEqual('<div class="block" id="id1"><input checked value="some value"></input></div>');
    });

    it('should stringify stateless component', () => {
        type Props = {
            id: string
        };
        const Block: StatelessComponent<Props> = ({ children, id }) => <div class='block' id={id}>
            <input checked value={'some value'} />
            {children}
        </div>;

        expect(renderServer(<Block id='id1'>some text</Block>, {}))
            .toEqual('<div class="block" id="id1"> <input checked value="some value"></input>some text</div>');
    });
});
