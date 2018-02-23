import { Map } from './types';

export const intrinsicProps: Map<boolean> = {
    key: true,
    ref: true,
    uniqid: true,
    wrapperRef: true
};

export const intrinsicPropsWrapper: Map<boolean> = {
    key: true,
    uniqid: true,
    wrapperRef: true
};

export const disabledAttrs: Map<boolean> = {
    targetComponentType: true,
    key: true,
    uniqid: true,
    ref: true,
    wrapperRef: true,
    children: true
};

export const serverIgnoreAttrTypes: Map<boolean> = {
    function: true,
    undefined: true
};
