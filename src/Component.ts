import { Map, Children } from './types';
import { shallowClone } from './shallowClone';

export class Component<Props extends Map<any>, State = void> {
    constructor(public props: Props, public children: Children) {}
}
