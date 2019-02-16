///<reference path="./@types/index.d.ts" />
import { check, isArguments, isEmpty, isUndefinedOrNull, isBuffer } from './check';
import { decycle } from './decycle';
import { unsetKeyPath, setValueForKeyPath, unflatten } from './keypath';

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
type MergeMethod = '!' | '&' | '!' | '=' | '?' | '+' | '|' | '-' | '^' | '*';

interface MergeOptions {
    arrayMergeMethod?: MergeMethod
    objectMergeMethod?: MergeMethod
    strict?: boolean
    indent?: string // debug
}

const compareFilter = (arr1: any[], arr2: any[], fn: (a: any, b: any) => any, filter?: boolean) => {
    const ret = [];
    for (let i = 0; i < arr1.length; i++) {
        const a = arr1[i];
        const b = arr2[i];
        const v = fn(a, b);
        if (v || (check(v, Number))) ret.push(v);
    }
    return ret;
}

function _mergeArray(lhs: any[], _rhs: any[], arrayMergeMethod: MergeMethod) {
    let rhs = arrayify(_rhs);
    switch (arrayMergeMethod) {
        case '=': return rhs;
        case '+': return concat(lhs, rhs);
        case '-': return difference(lhs, rhs);
        case '!': return difference(rhs, lhs);
        case '&': return intersect(lhs, rhs);
        case '|': return union(lhs, rhs);
        case '^':
            const common = intersect(lhs, rhs);
            return concat(difference(lhs, common), difference(rhs, common));
        case '?': return compareFilter(lhs, rhs, (a, b) => a && b);
        case '*': return compareFilter(lhs, rhs, (a, b) => b && a);
        default: throw new Error(`unhandled Array merge operator ${arrayMergeMethod}`);
    }
}

function mergeArray(lhs: any[], rhs: any[], arrayMergeMethod: MergeMethod): any[] {
    if (check(rhs, Object)) {
        for (const possiblyMergeOperator of Object.keys(rhs)) {
            switch (possiblyMergeOperator) {
                case '<*': case '<=': case '<&': case '<|': case '<?': case '<!': case '<+': case '<!': case '<-': case '<^':
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

export function mergeAny(lhs: any, rhs: any, options: MergeOptions) {
    if (check(lhs, Array)) {
        return mergeArray(lhs, rhs, options.arrayMergeMethod);
    }
    if (lhs instanceof Date) {
        if (rhs instanceof Date) {
            return new Date(rhs.valueOf());
        }
        else if (check(rhs, [Boolean, Number])) {
            return rhs > 0 && rhs < 2 && lhs;
        }
        throw new Error(`ambiguous merge Date ${options.objectMergeMethod} ${typeof rhs}: ${rhs}`);
    }
    if (check(lhs, Object)) {
        if (check(rhs, Object)) {
            return mergeObject(lhs, rhs, { ...options, indent: options.indent + '  ' });
        } else if (check(rhs, [Boolean, Number])) {
            switch (options.objectMergeMethod) {
                case '^': return rhs;
                case '*': return rhs > 0 && rhs < 2 && lhs;
            }
        } else if (check(rhs, Array)) {
            return rhs;
        }
        throw new Error(`ambiguous merge Object ${options.objectMergeMethod} ${typeof rhs}: ${rhs}\n${JSON.stringify(lhs)}`);
    }
    switch (options.objectMergeMethod) {
        case '*': return rhs && lhs;
    }
    return rhs;
}



export function mergeObject<T>(target: T & { [index: string]: any }, setter: any, options: MergeOptions): T {
    const { objectMergeMethod, arrayMergeMethod, indent } = options;
    const results: any = {};

    const expandedSetter = unflatten({}, setter);
    for (const key of Object.keys(expandedSetter)) {
        switch (key) {
            case '<*': case '<=': case '<&': case '<|': case '<?': case '<!': case '<+': case '<!': case '<-': case '<^': break;
            default:
                let lhs = target[key];
                let rhs = expandedSetter[key];
                const assign = mergeAny(lhs, rhs, options);
                if (assign) {
                    const extendIt = () => {
                        target[key] = assign;
                        results[key] = assign;
                    }
                    switch (objectMergeMethod) {
                        case '|': case '+': case '=': extendIt(); break;
                        case '^': if (!lhs) target[key] = assign; else results[key] = assign; break;
                        case '!': if (!lhs) extendIt(); break;
                        case '?': case '&': case '*': if (lhs) extendIt(); break;
                        case '-': if (rhs && setter[key]) delete target[key]; break; // HACK: not present in seter suggests it's a kp, defer for later
                    }
                }
        }
    }

    for (const key of Object.keys(expandedSetter)) {
        switch (key) {
            case '<*': case '<=': case '<&': case '<|': case '<?': case '<!': case '<+': case '<!': case '<-': case '<^':
                const method = <any>key.slice(1);
                const res = mergeAny(target, expandedSetter[key], {
                    objectMergeMethod: method,
                    arrayMergeMethod: method,
                    indent: indent + '  ',
                });
                if (check(res, Object)) {
                    extend(results, res);
                } else {
                    target = res;
                    // return res;
                }
            default: break;
        }
    }

    if (check(target, Object)) {
        for (const key of Object.keys(target)) {
            let lhs = target[key];
            let rhs = results[key];
            switch (objectMergeMethod) {
                case '=': if (!rhs) delete target[key]; break;
                case '&': case '*': if (!rhs) delete target[key]; break;
                case '^':
                    if (check(lhs, Object) && check(rhs, Object)) {
                    } else {
                        if (lhs && rhs) delete target[key];
                        else if (rhs) target[key] = rhs;
                    }
                    break;
                default: break;
            }
        }
    }

    return target;
}

export function merge<T>(target: T & { [index: string]: any }, setter: any, options: MergeOptions = {}): T {
    const objectMergeMethod = options.objectMergeMethod || '|';
    const arrayMergeMethod = options.arrayMergeMethod || '=';
    // this function mutates obj
    if (check(target, Array)) {
        return <T><any>mergeArray(<any>target, setter, arrayMergeMethod);
    }
    return mergeObject(target, setter, { objectMergeMethod, arrayMergeMethod, indent: '' });
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

export function clone<T>(obj: T, stacktrace: any[] = [], recursive: any = []): T {
    var copy;

    // Handle the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj) return obj;

    for (const ptr in recursive) {
        if (ptr as any == obj[key]) {
            // console.log(ptr, '=', obj);
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
                    // console.log(stacktrace.join('.'), e);
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
