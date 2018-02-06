function componentInit(instance) {
    if (typeof instance.init === 'function') {
        instance.init();
    }
}

function componentBeforeRender(instance) {
    if (!instance._componentMounted && typeof instance.componentWillMount !== 'undefined') {
        instance.componentWillMount();
    }
}

function componentDestroy(instance) {
    if (typeof instance.componentWillDestroy !== 'undefined') {
        instance.componentWillDestroy();
    }
}

function componentUpdate(instance) {
    if (typeof instance.componentDidUpdate !== 'undefined') {
        instance.componentDidUpdate();
    }
}

function componentMount(instance) {
    instance._componentMounted = true;

    if (typeof instance.componentDidMount !== 'undefined') {
        instance.componentDidMount();
    }
}

function componentSetProps(instance, props, additional) {
    if (typeof instance.componentWillReceiveProps !== 'undefined') {
        instance._settingProps = true;
        instance.componentWillReceiveProps(props, additional);
        instance._settingProps = false;
    }

    instance.props = props;
}

function componentUnmount(instance) {
    instance._componentMounted = false;

    if (typeof instance.componentWillUnmount !== 'undefined') {
        instance.componentWillUnmount();
    }
}

export {
    componentInit,
    componentBeforeRender,
    componentDestroy,
    componentUpdate,
    componentMount,
    componentSetProps,
    componentUnmount
};
