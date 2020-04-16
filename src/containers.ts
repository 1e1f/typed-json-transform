///<reference path="../@types/index.d.ts" />

import { check, isEmpty, MapLike } from './check';
import { decycle } from './decycle';
import { mergeOrReturnAssignment } from './merge';
import { every, Mutate } from './arrays';


export const set = (t: TJT.MapLike<any>, [k, v]: any[]): void => {
    if (t instanceof Map) {
        t.set(k, v);
    } else {
        t[k as string] = v;
    }
}

export const unset = <T>(t: T & TJT.MapLike<any>, k: string | number): void => {
    if (t instanceof Map) {
        t.delete(k);
    } else {
        delete t[k];
    }
}

export const get = <T>(s: TJT.MapLike<T>, k: string | number): T =>
    (s instanceof Map) ?
        s.get(k)
        :
        s[k]

export function each<T>(iter: TJT.Iterable<T>, fn: (val: T, index?: string | number, breakLoop?: () => void) => void): void {
    let broken = 0;
    const breakLoop = (() => { broken = 1; })

    if (Array.isArray(iter)) {
        let index = 0;
        for (const v of iter) {
            fn(v, index, breakLoop);
            if (broken) {
                return;
            }
            index++;
        }
    } else if (iter instanceof Map) {
        for (const [k, v] of iter) {
            fn(v, k, breakLoop);
            if (broken) {
                return;
            }
        }
    } else {
        for (const k of Object.keys(iter)) {
            fn((<{ [index: string]: T }><any>iter)[k], k, breakLoop);
            if (broken) {
                return;
            }
        }
    }
}

export function replace<A, B>(target: A & TJT.MapLike<any>, source: B & TJT.MapLike<any>): A & B {
    each(source, (v, k) => unset(target, k));
    return extend(target, source);
}

export function extend<A, B>(target: A & TJT.MapLike<any>, source: B & TJT.MapLike<any>): A & B {
    if (check(source, MapLike)) {
        return <A & B>extendN(target, source as any);
    }
    return <A & B>target;
}

export function extendOwn<A, B>(target: A & TJT.MapLike<any>, source: B & TJT.MapLike<any>): A & B {

    each(source, (rhs, key) => {
        const lhs = get(target, key);
        if (check(lhs, MapLike) && check(rhs, MapLike)) {
            extendOwn(lhs, rhs);
        } else if (lhs) {
            set(target, [key, clone(get(source, key))]);
        }
    });

    return <A & B>target;
}

export function existentialExtend<A, B>(target: A & TJT.MapLike<any>, source: B & TJT.MapLike<any>): A & B {
    each(source, (v, key) => {
        const lhs = get(target, key);
        const rhs = get(source, key);
        if (!lhs) {
            set(target, [key, clone(rhs)]);
        }
        else if (check(lhs, MapLike) && check(rhs, MapLike)) {
            existentialExtend(lhs, rhs);
        }
    })
    return <A & B>target;
}

export function extendN<T>(target: any, ...sources: Array<T | TJT.MapLike<any>>): T {
    for (const source of sources) {
        each(source, (v, k) => set(target, [k, v]));
    }
    return target;
}

export function flatten<A>(arr: A[][]): A[] {
    let stack: A[] = [];
    for (const v of arr) {
        if (check(v, Array)) {
            Mutate.concat(stack, flatten(<A[][]><any>v));
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

export function combineN<T>(retType: T, ...args: TJT.MapLike<any>[]): T {
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
    for (const dict of args) {
        if (check(dict, Object)) {
            merge(target, dict);
        }
    }
    return target;
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


function _prune(input: TJT.MapLike<any>): boolean {
    if (!check(input, Object)) {
        throw new Error('attempting to _prune undefined object');
    }
    const ref = input;
    let pruned = false;
    each(ref, (val, k) => {
        if (check(val, Object)) {
            if (_prune(val)) {
                pruned = true;
            }
            if (isEmpty(val)) {
                unset(ref, k);
                pruned = true;
            }
        }
        if (val === undefined) {
            unset(ref, k);
        }
    })
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

export function clone<T>(obj: T & TJT.Iterable<any>, stacktrace: any[] = [], addr: any = []): T {
    var copy;

    // Handle the 3 simple types, and null or undefined
    if (null == obj || ("object" != typeof obj)) return obj;

    each(addr, (ptr) => {
        each(obj, (v, key) => {
            if (ptr as any === v) {
                throw new Error(`terminate recursive clone @ ${key}; ${v} = ${ptr} stack: ${stacktrace.join('.')}, addr: ${addr}}`);
            }
        });
    });

    // Handle Date
    if (obj instanceof Date) {
        copy = new Date();
        copy.setTime(obj.getTime());
        return <T><any>copy;
    }

    // Handle Array
    else if (obj instanceof Array) {
        copy = [];
        for (var i = 0, len = obj.length; i < len; i++) {
            copy[i] = clone(obj[i], [...stacktrace, `[${i}]`], [...addr, obj]);
        }
        return <T><any>copy;
    }

    // Handle Map
    else if (obj instanceof Map) {
        copy = new Map();
        for (const [k, v] of obj) {
            copy.set(k, clone(v, [...stacktrace, `[${i}]`], [...addr, obj]));
        }
        return <T><any>copy;
    }

    // force to handle as object even if instanceof Object returns null i.e. Object.create(null)
    else {
        let copy = <any>{};
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
            each(obj, (v, key) => {
                (<any>copy)[key] = clone(v, [...stacktrace, key], [...addr, obj]);
            });
        }
        return <T><any>copy;
    }
}

// export function okmap<R, I, IType extends TJT.Iterable<I>, RType extends R[]>(iterable: IType, fn: (v: I, k?: string | number) => {[index: number]: R}): RType
export function okmap<R, I, IType extends TJT.Iterable<I>, RType extends TJT.Iterable<R>>(iterable: IType, fn: (v: I, k?: string | number) => R): RType {
    const o: {[index: string] :R} = {};
    const a: R[] = <any>[];
    each(iterable, (_v: I, _k: string | number) => {
        let k = _k;
        let v = fn(_v, k);
        if (check(v, Object)) {
            const keys = Object.keys(v);
            if (keys.length == 2 && (keys[0] == 'key' || keys[1] == 'key')) {
                k = (<any>v).key;
                v = <R>(<any>v).value;
            }
        }
        o[k as string] = v;
        if (k >= 0) {
            a[k as number] = v;
        }
    });
    if (every(Object.keys(o), (k) => check(k, Number))) return a as RType;
    return o as RType;
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
