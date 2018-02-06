import { TEMPLATE_FRAGMENT } from './types';

function TemplateFragment(fragment) {
    this.fragment = fragment;
}

TemplateFragment.prototype = {
    type: TEMPLATE_FRAGMENT
};

export { TemplateFragment };
