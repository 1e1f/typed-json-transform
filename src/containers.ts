///<reference path="./@types/index.d.ts" />
import { check, isArguments, isEmpty, isUndefinedOrNull, isBuffer } from './check';
import { decycle } from './decycle';

interface SIO { [index: string]: any }

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
type MergeMethod = '!' | '&' | '!' | '=' | '?' | '+' | '|' | '-' | '^';

interface MergeOptions {
    arrayMergeMethod?: MergeMethod
    objectMergeMethod?: MergeMethod
}

function _mergeArray(existing: any[], future: any[], arrayMergeMethod: MergeMethod) {
    switch (arrayMergeMethod) {
        case '=': return future;
        case '+': return concat(existing, arrayify(future));
        case '|': return union(existing, future);
        case '?': case '&': return intersect(existing, future);
        case '-': return difference(existing, arrayify(future));
        case '^': case '!': return difference(future, existing);
    }
}

function mergeArray(lhs: any[], rhs: any[], arrayMergeMethod: MergeMethod): any[] {
    if (check(rhs, Object)) {
        for (const possiblyMergeOperator of Object.keys(rhs)) {
            switch (possiblyMergeOperator) {
                case '<=': case '<&': case '<|': case '<?': case '<!': case '<+': case '<!': case '<-': case '<^':
                    return _mergeArray(<any[]>lhs, (<any>rhs)[possiblyMergeOperator], <MergeMethod>possiblyMergeOperator.slice(1));
            }
        };
        throw new Error(`merging object into array (object contains no merge methods), ${JSON.stringify(rhs)}`);
    }
    if (check(rhs, Array)) {
        return _mergeArray(<any[]>lhs, <any[]>rhs, arrayMergeMethod);
    }
    throw new Error('replacing array value with non-array value');
}

export function applyMergeMethod(lhs: any, rhs: any, options: MergeOptions) {
    if (check(lhs, Array)) {
        return mergeArray(lhs, rhs, options.arrayMergeMethod);
    }
    if (lhs instanceof Date) {
        if (rhs instanceof Date) {
            return new Date(rhs.valueOf());
        }
        throw new Error('replacing date value with non-date value');
    }
    if (check(lhs, Object)) {
        if (check(rhs, Object)) {
            return mergeObject(lhs, rhs, options);
        }
        throw new Error('merging non object value into object value at keypath')
    }
    return rhs;
}

export function mergeObject<T>(target: T & { [index: string]: any }, setter: any, options: MergeOptions): T {
    const { objectMergeMethod, arrayMergeMethod } = options;

    let res: any = target;
    if (objectMergeMethod == '=' || objectMergeMethod == '^' || objectMergeMethod == '&') {
        res = {};
    }

    for (const key of Object.keys(setter)) {
        switch (key) {
            case '<=': case '<&': case '<|': case '<?': case '<!': case '<+': case '<!': case '<-': case '<^':
                const method = <any>key.slice(1);
                return mergeObject(target, setter[key], {
                    objectMergeMethod: method,
                    arrayMergeMethod
                });
            default: break;
        }
    }

    for (const key of Object.keys(setter)) {
        const lhs = target[key];
        const rhs = setter[key];

        const assign = applyMergeMethod(lhs, rhs, options);

        switch (objectMergeMethod) {
            case '=': case '|': case '+': res[key] = assign; break;
            case '!': case '^': if (!lhs) res[key] = assign; break;
            case '?': if (lhs) res[key] = assign; break;
            case '&':
                if (lhs && rhs) res[key] = assign;
                else delete res[key];
                break;
            case '-': if (rhs) delete res[key]; break;
        }
    }
    return res;
}

export function merge<T>(target: T & { [index: string]: any }, setter: any, options: MergeOptions = {}): T {
    const objectMergeMethod = options.objectMergeMethod || '|';
    const arrayMergeMethod = options.arrayMergeMethod || '=';
    // this function mutates obj
    if (check(target, Array)) {
        return <T><any>mergeArray(<any>target, setter, arrayMergeMethod);
    }
    return mergeObject(target, setter, { objectMergeMethod, arrayMergeMethod });
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

export function every<T>(iter: { [index: string]: T } | T[], fn: (val: T, index?: string | number) => boolean): boolean {
    if (check(iter, Array)) {
        let index = 0;
        if (!(iter as any[]).length) return false;
        for (const v of <T[]>iter) {
            if (!fn(v, index)) {
                return false;
            }
            index++;
        }
    } if (check(iter, Object)) {
        const keys = Object.keys(iter);
        if (!keys.length) return false;
        for (const k of keys) {
            if (!fn((<any>iter)[k], k)) {
                return false;
            }
        }
    }
    return true;
}

// export const everyAsync = <T>(iter: { [index: string]: T } | T[], fn: (val: T, index?: string | number) => boolean): Promise<boolean> => {
//     return new Promise(async (resolve, reject) => {
//         if (check(iter, Array)) {
//             let index = 0;
//             if (!(iter as any[]).length) return resolve(false);
//             for (const v of <T[]>iter) {
//                 try {
//                     const res = await fn(v, index);
//                     if (!res) return resolve(false);
//                 } catch (e) {
//                     return reject(e);
//                 }
//                 index++;
//             }
//         } if (check(iter, Object)) {
//             const keys = Object.keys(iter);
//             if (!keys.length) return resolve(false);
//             for (const k of keys) {
//                 try {
//                     const res = await fn((<any>iter)[k], k);
//                     if (!res) return resolve(false);
//                 } catch (e) {
//                     return reject(e);
//                 }
//             }
//         }
//         return resolve(true);
//     });
// }

// export function every<T>(iterable: T[], fn: (arg: T) => boolean): boolean {
//     for (const v of iterable) {
//         if (fn(v) === false) {
//             return false;
//         }
//     }
//     return true;
// }

export const all = every;

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

export function union<T>(...args: T[][]): T[] {
    const res: T[] = [];
    for (const arr of args) {
        for (const v of arr) {
            if (!contains(res, v)) {
                res.push(v);
            }
        }
    }
    return res;
}

export function concat<T>(...args: T[][]): T[] {
    const res: T[] = [];
    for (const arr of args) {
        for (const v of arr) {
            res.push(v);
        }
    }
    return res;
}

export function intersect<T>(...args: T[][]): T[] {
    const res = <T[]>[];
    for (const a of args) {
        for (const v of a) {
            if (!contains(res, v)) {
                if (every(args, (b) => {
                    if (b == a) {
                        return true;
                    }
                    return contains(b, v) > 0;
                })) {
                    res.push(v);
                }
            }
        }
    }
    return res;
}

export function difference<T>(a: T[], b: T[]): T[] {
    const res = <T[]>[];
    for (const v of a) {
        if (!contains(b, v)) {
            res.push(v);
        }
    }
    return res;
}

export function contains<T>(set: any[], toMatch: T): number {
    if (check(toMatch, Array)) {
        return containsAny(set, toMatch as any);
    }
    let matches = 0;
    for (const val of set) {
        if (isEqual(val, toMatch)) {
            matches++;
        }
    }
    return matches;
}

export function containsAny<T>(set: any[], match: any[]): number {
    if (!check(match, Array)) {
        throw new Error('contains all takes a list to match');
    }
    let matches = 0;
    for (const val of match) {
        if (contains(set, val)) {
            // return true;
            matches++;
        }
    }
    return matches;
}

export function containsAll<T>(set: any[], match: any[]): boolean {
    if (!check(match, Array)) {
        throw new Error('contains all takes a list to match');
    }
    for (const val of match) {
        if (!contains(set, val)) {
            return false;
        }
    }
    return true;
}

export function isEqual(a: any, e: any, opts?: ComparisonOptions): boolean {
    // http://wiki.commonjs.org/wiki/Unit_Testing/1.0
    if (!opts) opts = <ComparisonOptions>{};
    // 7.1. All identical values are equivalent, as determined by ===.
    if (a === e) {
        return true;
    }
    else if (a instanceof Date && e instanceof Date) {
        return a.getTime() === e.getTime();
        // 7.3. Other pairs that do not both pass typeof value == 'object',
        // equivalence is determined by ==.
    } else if (!a || !e || typeof a != 'object' && typeof e != 'object') {
        return opts.strict ? a === e : a == e;
        // 7.4. For all other Object pairs, including Array objects, equivalence is
        // determined by having the same number of owned properties (as verified
        // with Object.prototype.hasOwnProperty.call), the same set of keys
        // (although not necessarily the same order), equivalent values for every
        // corresponding key, and an identical 'prototype' property. Note: this
        // accounts for both named and indexed properties on Arrays.
    }
    return _objEquiv(a, e, opts);
}

const pSlice = Array.prototype.slice;

const compareBuffer = (a: Buffer, b: Buffer) => {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

function _objEquiv(a: any, b: any, opts?: ComparisonOptions): boolean {
    if (isUndefinedOrNull(a) || isUndefinedOrNull(b)) return false;
    // an identical 'prototype' property.
    if (a.prototype !== b.prototype) return false;
    //~~~I've managed to break Object.keys through screwy arguments passing.
    //   Converting to array solves the problem.
    if (isArguments(a)) {
        if (!isArguments(b)) return false;
        a = pSlice.call(a);
        b = pSlice.call(b);
        return isEqual(a, b, opts);
    }
    if (isBuffer(a)) {
        if (!isBuffer(b)) return false;
        return compareBuffer(a, b);
    }
    let ka, kb;
    try {
        ka = Object.keys(a);
        kb = Object.keys(b);
    } catch (e) {//happens when one is a string literal and the other isn't
        return false;
    }
    // having the same number of owned properties (keys incorporates
    // hasOwnProperty)
    if (ka.length != kb.length) return false;
    //the same set of keys (although not necessarily the same order),
    ka.sort();
    kb.sort();
    //~~~cheap key test
    for (let i = ka.length - 1; i >= 0; i--) {
        if (ka[i] != kb[i]) return false;
    }
    //equivalent values for every corresponding key, and
    //~~~possibly expensive deep test
    for (let i = ka.length - 1; i >= 0; i--) {
        const key = ka[i];
        if (!isEqual(a[key], b[key], opts)) return false;
    }
    return typeof a === typeof b;
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


export function clone<T>(obj: T): T {
    var copy;

    // Handle the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj) return obj;

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
            copy[i] = clone(obj[i]);
        }
        return <T><any>copy;
    }

    // Handle Object
    if (obj instanceof Object) {
        const from: any = obj;
        let copy = <any>{};
        const { hasOwnProperty } = Object.prototype;

        if (from != null) {
            if (from.clone) {
                try {
                    copy = from.clone(from);
                }
                catch (e) {
                    throw new Error(`${typeof obj} instance: clone(${from}) failed`);
                }
            }
            else if (from.constructor) {
                try {
                    copy = new (from.constructor)();
                }
                catch (e) {
                    // copy = {};
                    throw new Error(`${typeof obj} instance: ${from.constructor}() failed: ${e.message}`);
                }
            }
            for (var key in from) {
                if (hasOwnProperty.call(from, key)) {
                    (<any>copy)[key] = clone(from[key]);
                }
            }
        }
        return <T><any>copy;
    }

    throw new Error("Unable to copy obj! Its type isn't supported.");
}

// export function clone<T>(input: T): T {
//     // return <T>retrocycle(decycle(input));
//     // Handle Date (return new Date object with old value)
//     if ((input !== null && typeof input === 'function')) {
//         return input;
//     }

//     if (input instanceof Date) {
//         return new Date(input as any) as any;
//     }

//     // Handle Array (return a full slice of the array)
//     if (input instanceof Array) {
//         // return (input as any).slice();
//         return <T><any>input.map(clone);
//     }

//     // Handle Object
//     if (input instanceof Object) {
//         // const copy = new (input as any).constructor(plain(input));
//         const copy: any = {};
//         if ((input as any).prototype) copy.prototype = (input as any).prototype;
//         if ((input as any).constructor) copy.constructor = (input as any).constructor;
//         for (var attr in input) {
//             if (input.hasOwnProperty(attr)) {
//                 if (input[attr] instanceof Object) {
//                     copy[attr] = clone(input[attr]);
//                 } else {
//                     copy[attr] = input[attr];
//                 }
//             }
//         }
//         return copy;
//     }

//     return input;
// }

export function arrayify<T>(val: T | T[]): T[] {
    if (check(val, Array)) {
        return val as T[];
    }
    return [val as T];
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
    const a = <(R | Promise<R>)[]><any>[];
    interface Wrapable { key: string, valuePromise: R | Promise<R> }
    let keys: string[] = [];
    const prepForPromiseAll = ({ key, valuePromise }: Wrapable) => new Promise((resolve) =>
        Promise.resolve(valuePromise).then((resolved) =>
            resolve({
                key, value: resolved
            })
        )
    );

    const oa = <Promise<any>[]>[];
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
        keys.push(k);
        oa.push(prepForPromiseAll({ key: k, valuePromise: v }));
        if (<any>k >= 0) {
            a[<any>k] = v;
        }
    });
    if (every(keys, (k) => check(k, Number))) return Promise.all(a);
    const r: any = {};
    return Promise.all(oa).then((resolved) => {
        each(resolved, (kv) => r[kv.key] = kv.value);
        return Promise.resolve(r);
    });
}


export function stringify(value: any, replacer?: (number | string)[], space?: string | number): string {
    return JSON.stringify(decycle(value), replacer, space || 2);
}
