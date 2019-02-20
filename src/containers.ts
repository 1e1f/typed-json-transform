///<reference path="../@types/index.d.ts" />

import { check, isEmpty } from './check';
import { decycle } from './decycle';
import { mergeOrReturnAssignment } from './merge';
import { every } from './arrays';

export function each<T>(iter: { [index: string]: T } | T[], fn: (val: T, index?: string | number, breakLoop?: () => void) => void): void {
    let broken = 0;
    const breakLoop = (() => { broken = 1; })

    if (check(iter, Array)) {
        let index = 0;
        for (const v of <T[]>iter) {
            fn(v, index, breakLoop);
            if (broken) {
                return;
            }
            index++;
        }
    } else if (check(iter, Object)) {
        for (const k of Object.keys(iter)) {
            fn((<{ [index: string]: T }><any>iter)[k], k, breakLoop);
            if (broken) {
                return;
            }
        }
    }
}

export function replace<A, B>(target: A & SIO, source: B & SIO): A & B {
    if (check(source, Object)) {
        for (const key of Object.keys(source)) {
            delete target[key];
        }
    }
    return extend(target, source);
}

export function extend<A, B>(target: A & SIO, source: B & SIO): A & B {
    if (check(source, Object)) {
        return <A & B>extendN(target, source);
    }
    return <A & B>target;
}

export function extendOwn<A, B>(target: A & SIO, source: B & SIO): A & B {
    if (check(source, Object)) {
        for (const key of Object.keys(source)) {
            if (check(source[key], Object) && check(target[key], Object)) {
                extendOwn(target[key], source[key]);
            } else if (target[key]) {
                target[key] = clone(source[key]);
            }
        }
    }
    return <A & B>target;
}

export function existentialExtend<A, B>(target: A & SIO, source: B & SIO): A & B {
    if (check(source, Object)) {
        for (const key of Object.keys(source)) {
            if (!target[key]) {
                target[key] = clone(source[key]);
            }
            else if (check(source[key], Object) && check(target[key], Object)) {
                existentialExtend(target[key], source[key]);
            }
        }
    }
    return <A & B>target;
}

export function extendN<T>(target: T & SIO, ...sources: Array<SIO>): T {
    for (const source of sources) {
        if (check(source, Object)) {
            const copy = clone(source);
            for (const attr in copy) {
                target[attr] = copy[attr];
            }
        } else {
            throw new Error(`extending object with scalar value ${JSON.stringify(source)}, only use objects`);
        }
    }
    return <T>target;
}

export function flatten<A>(arr: A[][]): A[] {
    let stack: A[] = [];
    for (const v of arr) {
        if (check(v, Array)) {
            stack = stack.concat(flatten(<A[][]><any>v));
        } else {
            stack.push(<A><any>v);
        }
    }
    return stack;
}

export function keysAndValues<T>(object: { [index: string]: T }): { keys: string[], values: T[] } {
    const keys: string[] = [];
    const values: T[] = [];
    each(object, (v: T, k: string) => {
        keys.push(k);
        values.push(v);
    });
    return { keys, values };
}

export function assign<A, B>(a: A, b: B): A & B {
    let result = clone(a);
    return extend(result || <A>{}, clone(b));
}

export function combine<A, B>(a: A, b: B): A & B {
    let result = clone(a);
    return extend(result || <A>{}, clone(b));
}

export function combineN<T>(retType: T, ...args: SIO[]): T {
    const result = clone(retType);
    for (const dict of args) {
        if (check(dict, Object)) {
            extend(result, dict);
        }
    }
    return result;
}


export function merge<T>(target: any, setter: any, state?: Merge.State) {
    const res = mergeOrReturnAssignment({
        data: target, state: {
            merge: {
                operator: '|'
            },
            ...state
        }
    }, setter).data;
    if (res || check(res, Number)) {
        return res;
    }
    return target;
}

export function mergeN<T>(target: T & { [index: string]: any }, ...args: any[]): T {
    const result = clone(target);
    for (const dict of args) {
        if (check(dict, Object)) {
            merge(result, dict);
        }
    }
    return result;
}

export function or<A, B>(a: A, b: B): A & B {
    const ret = <any>clone(a);
    each(b, (v: any, k: string) => {
        ret[k] = (<any>a)[k] || (<any>b)[k];
    });
    return ret;
}

export function any<T>(iter: { [index: string]: T } | T[], fn: (val: T, index?: string | number) => boolean): boolean {
    if (check(iter, Array)) {
        let index = 0;
        for (const v of <T[]>iter) {
            if (fn(v, index)) {
                return true;
            }
            index++;
        }
    } if (check(iter, Object)) {
        for (const k of Object.keys(iter)) {
            if (fn((<any>iter)[k], k)) {
                return true;
            }
        }
    }
    return false;
}

export function map<R, I>(iter: { [index: string]: I } | I[], fn: (val: I, index: any) => R): R[] {
    const res: R[] = [];
    if (check(iter, Array)) {
        let i = 0;
        for (const v of <I[]>iter) {
            res.push(fn(v, i));
            i++;
        }
    } if (check(iter, Object)) {
        for (const k of Object.keys(iter)) {
            res.push(fn((<{ [index: string]: I }>iter)[k], k));
        }
    }
    return res;
}

export function amap<R, I>(iter: { [index: string]: I } | I[], fn: (val: I, index: any) => R | Promise<R>): Promise<R[]> {
    const arr: (R | Promise<R>)[] = [];
    if (check(iter, Array)) {
        let i = 0;
        for (const v of <I[]>iter) {
            arr.push(fn(v, i));
            i++;
        }
    } if (check(iter, Object)) {
        for (const k of Object.keys(iter)) {
            arr.push(fn((<{ [index: string]: I }>iter)[k], k));
        }
    }
    return Promise.all(arr);
}

export function reduce<T, S>(input: Array<T>, fn: (input: T, memo: S) => S, base?: S): S
export function reduce<T, S>(input: { [index: string]: T }, fn: (input: T, memo: S) => S, base?: S): S {
    let sum: S = base;
    each(input, (value: T) => {
        sum = fn(value, sum)
    });
    return sum;
}

export function sum<T>(input: { [index: string]: T } | Array<T>, fn: (input: T) => number): number {
    let sum = 0;
    each(input, (value: T) => {
        sum = sum + fn(value);
    });
    return sum;
}

export function greatestResult<T>(input: { [index: string]: T } | Array<T>, fn: (input: T) => number): number {
    let greatestResult = 0;
    each(input, (value: T) => {
        const res = fn(value);
        if (res > greatestResult) greatestResult = res;
    });
    return greatestResult;
}

export function sumIfEvery<T>(input: { [index: string]: T } | Array<T>, fn: (input: T) => number): number {
    let sum = 0;
    each(input, (value: T, index: any, breakLoop: Function) => {
        const res = fn(value);
        if (res > 0) {
            sum = sum + res;
        }
        else {
            sum = 0;
            breakLoop();
        }
    });
    return sum;
}

export function geoSum<T>(input: { [index: string]: T } | Array<T>, fn: (input: T, memo: number) => number): number {
    let sum = 1;
    each(input, (value: T, key: any, breakLoop: Function) => {
        sum *= fn(value, sum)
    });
    return sum;
}


function _prune(input: SIO): boolean {
    if (!check(input, Object)) {
        throw new Error('attempting to _prune undefined object');
    }
    const ref = input;
    let pruned = false;
    for (const k of Object.keys(ref)) {
        const val = ref[k];
        if (check(val, Object)) {
            if (_prune(val)) {
                pruned = true;
            }
            if (isEmpty(val)) {
                delete ref[k];
                pruned = true;
            }
        }
        if (val === undefined) {
            delete ref[k];
        }
    }
    return pruned;
}

export function prune<T>(obj: T): T {
    _prune(obj);
    return obj;
}

export function clean<T>(obj: T): T {
    for (const key of Object.keys(obj)) {
        delete (<any>obj)[key];
    }
    return obj;
}

export function plain<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
}

function ObjectAssign(target: any, source: any) {
    var from;
    var to = target;
    var index = 0;
    var total = arguments.length;
    var hasOwnProperty = Object.prototype.hasOwnProperty;

    while (++index < total) {
        from = arguments[index];

        if (from != null) {
            for (var key in from) {
                if (hasOwnProperty.call(from, key)) {
                    to[key] = from[key];
                }
            }
        }
    }

    return to;
}

export function clone<T>(obj: T, stacktrace: any[] = [], recursive: any = []): T {
    var copy;

    // Handle the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj) return obj;

    for (const ptr in recursive) {
        if (ptr as any == obj[key]) {
            throw new Error(`terminate recursive clone @ ${key}, stack: ${stacktrace.join('.')}`);
        }
    }

    // Handle Date
    if (obj instanceof Date) {
        copy = new Date();
        copy.setTime(obj.getTime());
        return <T><any>copy;
    }

    // Handle Array
    if (obj instanceof Array) {
        copy = [];
        for (var i = 0, len = obj.length; i < len; i++) {
            copy[i] = clone(obj[i], stacktrace.concat(`[${i}]`), recursive.concat(obj));
        }
        return <T><any>copy;
    }

    // Handle Object
    if (obj instanceof Object) {
        let copy = <any>{};
        const { hasOwnProperty } = Object.prototype;

        if (obj != null) {
            if ((obj as any).clone) {
                try {
                    return (obj as any).clone(obj);
                }
                catch (e) {
                    throw new Error(`${typeof obj} instance: clone(${obj}) failed`);
                }
            }
            else if (obj.constructor) {
                try {
                    copy = new ((obj as any).constructor)();
                }
                catch (e) {
                    throw new Error(`Error while cloning a(n) [ ${typeof obj} ] instance: ${JSON.stringify(obj)}`);
                    // throw new Error(`${typeof obj} instance: ${from.constructor}() failed: ${e.message}`);
                }
            }
            for (var key in obj) {
                if (hasOwnProperty.call(obj, key)) {
                    (<any>copy)[key] = clone(obj[key], stacktrace.concat(key), recursive.concat(obj));
                }
            }
        }
        return <T><any>copy;
    }

    throw new Error("Unable to copy obj! Its type isn't supported.");
}

export function okmap<R, I, IObject extends { [index: string]: I }, RObject extends { [index: string]: R }>(iterable: IObject | Array<I>, fn: (v: I, k?: string | number) => R): RObject {
    const o = <RObject>{};
    const a = <RObject><any>[];
    each(iterable, (_v: I, _k: string) => {
        let k = _k;
        let v = fn(_v, k);
        if (check(v, Object)) {
            const keys = Object.keys(v);
            if (keys.length == 2 && (keys[0] == 'key' || keys[1] == 'key')) {
                k = (<any>v).key;
                v = <R>(<any>v).value;
            }
        }
        o[k] = v;
        if (<any>k >= 0) {
            a[k] = v;
        }
    });
    if (every(Object.keys(o), (k) => check(k, Number))) return a;
    return o;
}


export function aokmap<R, I, IObject extends { [index: string]: I }>(iterable: IObject | Array<I>, fn: (v: I, k?: string | number) => R | Promise<R>): any {
    const createPromise = (_v: I, _k: string) => new Promise((resolve, reject) => {
        let key = _k;
        return Promise.resolve(fn(_v, key)).then(value => {
            if (check(value, Object)) {
                const keys = Object.keys(value);
                if (keys.length == 2 && (keys[0] == 'key' || keys[1] == 'key')) {
                    key = (<any>value).key;
                    value = <R>(<any>value).value;
                }
            }
            return resolve({ key, value })
        }, (e) => reject(e)).catch((e) => reject(e))
    });

    const pa = <Promise<any>[]>[];
    each(iterable, (_v: I, _k: string) => {
        pa.push(createPromise(_v, _k));
    });

    return Promise.all(pa).then((resolved) => {
        if (every(resolved, (kv) => check(kv.key, Number))) {
            const r: any = [];
            each(resolved, (kv) => {
                r[kv.key] = kv.value;
            });
            return Promise.resolve(r);
        } else {
            const r: any = {};
            each(resolved, (kv) => {
                r[kv.key] = kv.value;
            });
            return Promise.resolve(r);
        }
    });
}

export function stringify(value: any, replacer?: (number | string)[], space?: string | number): string {
    return JSON.stringify(decycle(value), replacer, space || 2);
}
