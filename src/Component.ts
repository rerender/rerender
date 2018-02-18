import { Map, Children } from './types';

export class Component<Props extends Map<any>, State = void> {
    constructor(public props: Props, public children: Children) {}
}
