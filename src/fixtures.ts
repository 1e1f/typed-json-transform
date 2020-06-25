import {
    clone
} from './containers';

export class CustomType {
    options: any;
    _data: any;
    data: any;
    constructor(_options = {
        isCustom: 'default'
    }, _data = [0, 'xyz']) {
        this.options = _options;
        this.data = _data;
    }
    memberFunction() {
        return this._data;
    }
}


export class SimpleClass {
    prop: any;
    constructor() {

    }
    method() {
        return this.prop;
    }
}

export class HasCopyMethod {
    props: string[];
    classDefault: string;
    isClone: boolean;

    constructor(props: string[]) {
        this.props = clone(props);
        this.classDefault = 'staticSetting';
    }

    clone() {
        const copy = new HasCopyMethod(this.props);
        copy.isClone = true;
        return copy;
    }
}
