import { Map, Children, Renderable, Path } from './types';
import { Channel } from './Channel';
import { shallowClone } from './shallowClone';

export abstract class Component<
    Props extends {
        [prop: string]: any;
        children?: PropsChildren
    },
    State = void,
    Defaults extends Partial<Props> = {},
    PropsChildren = Children
> {
    public $componentMounted?: boolean;
    public $settingProps?: boolean;
    public $id?: string;
    public $channel?: Channel;
    public $externalProps?: Props; // For correct defaultProps support only

    protected state: State;
    private $prevState: State;

    constructor(public props: Props & Defaults ) {}

    public componentWillUnmount?(): any;
    public componentDidMount?(): any;
    public componentDidCatch?(error: Error): any;
    public componentDidUpdate?(): any;
    public componentWillReceiveProps?(nextProps: Props & Defaults): any;
    public componentWillDestroy?(): any;
    public abstract render(): Renderable;

    public getStateSnapshot(path?: Path): any {
        if (this.$prevState) {
            delete this.$prevState;
        }

        return this.getState(path);
    }

    public getState(path?: Path): any {
        if (path && Array.isArray(path)) {
            let result: any = this.state;

            for (let i = 0, l = path.length; result !== undefined && i < l; i++) {
                result = result[path[i]];
            }

            return result;
        } else {
            return this.state;
        }
    }

    protected setState(value: any, path?: Path): void {
        if (path && Array.isArray(path)) {
            if (this.getState(path) !== value) {
                if (!this.$prevState) {
                    this.$prevState = this.state;
                    this.state = shallowClone(this.$prevState);
                }

                let stateParent: any = this.state;
                let prevStateParent: any = this.$prevState;
                const last = path.length - 1;

                for (let i = 0, l = last; i < l; i++) {
                    if (prevStateParent && typeof prevStateParent[path[i]] === 'object') {
                        if (stateParent[path[i]] === prevStateParent[path[i]]) {
                            stateParent[path[i]] = shallowClone(prevStateParent[path[i]]);
                        }
                        prevStateParent = prevStateParent[path[i]] || undefined;
                    } else {
                        stateParent[path[i]] = typeof path[i + 1] === 'number' ? [] : {};
                    }

                    stateParent = stateParent[path[i]];
                }

                stateParent[path[last]] = value;

                if (this.$channel && this.$componentMounted && !this.$settingProps) {
                    this.$channel.emit('component:change', this.$id);
                }
            }
        } else if (value && typeof value === 'object') {
            const keys = Object.keys(value);

            for (let i = 0, l = keys.length; i < l; i++) {
                this.setState(value[keys[i]], [keys[i]]);
            }
        }
    }
}
