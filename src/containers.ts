import { check } from './check';
import { decycle, retrocycle } from './decycle';

interface StringIndexableObject { [index: string]: any }


var pSlice = Array.prototype.slice;
function isArguments(object: any) {
    return Object.prototype.toString.call(object) == '[object Arguments]';
};

interface Opts {
    [index: string]: boolean;
    strict: boolean;
}

function each<T>(iter: { [index: string]: T } | T[], fn: (val: T, index: string | number) => void): void {
    if (check(iter, Array)) {
        let index = 0;
        for (const v of <T[]>iter) {
            fn(v, index);
            index++;
        }
    } if (check(iter, Object)) {
        for (const k of Object.keys(iter)) {
            fn((<{ [index: string]: T }>iter)[k], k);
        }
    }
}

function map<T>(iter: { [index: string]: T } | T[], fn: (val: any, index: any) => any): T[] {
    const res: T[] = [];
    if (check(iter, Array)) {
        let i = 0;
        for (const v of <T[]>iter) {
            res.push(fn(v, i));
            i++;
        }
    } if (check(iter, Object)) {
        for (const k of Object.keys(iter)) {
            res.push(fn((<{ [index: string]: T }>iter)[k], k));
        }
    }
    return res;
}

function extend(target: StringIndexableObject, ...sources: StringIndexableObject[]) {
    for (const source of sources) {
        if (check(source, Object)) {
            for (const key of Object.keys(source)) {
                if (check(source[key], Object) && check(target[key], Object)) {
                    extend(target[key], source[key]);
                } else {
                    target[key] = clone(source[key]);
                }
            }
        }
    }
    return target;
}

function combine(...args: Object[]) {
    const result = {};
    for (const dict of args) {
        if (check(dict, Object)) {
            extend(result, dict);
        }
    }
    return result;
}

function any(iterable: Array<any>, fn: Function) {
    for (const v of iterable) {
        if (fn(v) !== false) {
            return true;
        }
    }
    return false;
}

function every<T>(iterable: any[], fn: Function) {
    for (const v of iterable) {
        if (fn(v) === false) {
            return false;
        }
    }
    return true;
}

function tally<T>(input: Array<T>, fn: (input: T, memo: number) => number): number
function tally<T>(input: { [index: string]: T }, fn: (input: T, memo: number) => number): number {
    let sum = 0;
    each(input, (value: T) => {
        sum += fn(value, sum) || 0
    });
    return sum;
}

function union(...args: any[][]) {
    const res: any[] = [];
    for (const arr of args) {
        for (const v of arr) {
            if (!contains(res, v)) {
                res.push(v);
            }
        }
    }
    return res;
}

function intersect<T>(...args: any[][]) {
    const res = [];
    for (const a of args) {
        for (const v of a) {
            if (!contains(res, v)) {
                for (const b of args) {
                    if (contains(b, v)) {
                        res.push(v);
                    }
                }
            }
        }
    }
    return res;
}

function difference<T>(a: any[], b: any[]) {
    const res = [];
    for (const v of a) {
        if (!contains(b, v)) {
            res.push(v);
        }
    }
    return res;
}

function contains<T>(set: any[], match: T) {
    if (check(match, Array)) {
        return containsAny(set, match as any);
    }
    for (const val of set) {
        if (isEqual(val, match)) {
            return true;
        }
    }
    return false;
}

function containsAny<T>(set: any[], match: any[]) {
    if (!check(match, Array)) {
        throw new Error('contains all takes a list to match');
    }
    for (const val of match) {
        if (contains(set, val)) {
            return true;
        }
    }
    return false;
}

function containsAll<T>(set: any[], match: any[]) {
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

function isEqual(actual: any, expected: any, opts?: Opts): boolean {
    // http://wiki.commonjs.org/wiki/Unit_Testing/1.0
    if (!opts) opts = <Opts>{};
    // 7.1. All identical values are equivalent, as determined by ===.
    if (actual === expected) {
        return true;

    } else if (actual instanceof Date && expected instanceof Date) {
        return actual.getTime() === expected.getTime();

        // 7.3. Other pairs that do not both pass typeof value == 'object',
        // equivalence is determined by ==.
    } else if (!actual || !expected || typeof actual != 'object' && typeof expected != 'object') {
        return opts.strict ? actual === expected : actual == expected;

        // 7.4. For all other Object pairs, including Array objects, equivalence is
        // determined by having the same number of owned properties (as verified
        // with Object.prototype.hasOwnProperty.call), the same set of keys
        // (although not necessarily the same order), equivalent values for every
        // corresponding key, and an identical 'prototype' property. Note: this
        // accounts for both named and indexed properties on Arrays.
    } else {
        return objEquiv(actual, expected, opts);
    }
}

function isUndefinedOrNull(value: any) {
    return value === null || value === undefined;
}

function isBuffer(x: any) {
    if (!x || typeof x !== 'object' || typeof x.length !== 'number') return false;
    if (typeof x.copy !== 'function' || typeof x.slice !== 'function') {
        return false;
    }
    if (x.length > 0 && typeof x[0] !== 'number') return false;
    return true;
}

function objEquiv(a: any, b: any, opts?: Opts) {
    var i, key;
    if (isUndefinedOrNull(a) || isUndefinedOrNull(b))
        return false;
    // an identical 'prototype' property.
    if (a.prototype !== b.prototype) return false;
    //~~~I've managed to break Object.keys through screwy arguments passing.
    //   Converting to array solves the problem.
    if (isArguments(a)) {
        if (!isArguments(b)) {
            return false;
        }
        a = pSlice.call(a);
        b = pSlice.call(b);
        return isEqual(a, b, opts);
    }
    if (isBuffer(a)) {
        if (!isBuffer(b)) {
            return false;
        }
        if (a.length !== b.length) return false;
        for (i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) return false;
        }
        return true;
    }
    try {
        var ka = Object.keys(a),
            kb = Object.keys(b);
    } catch (e) {//happens when one is a string literal and the other isn't
        return false;
    }
    // having the same number of owned properties (keys incorporates
    // hasOwnProperty)
    if (ka.length != kb.length)
        return false;
    //the same set of keys (although not necessarily the same order),
    ka.sort();
    kb.sort();
    //~~~cheap key test
    for (i = ka.length - 1; i >= 0; i--) {
        if (ka[i] != kb[i])
            return false;
    }
    //equivalent values for every corresponding key, and
    //~~~possibly expensive deep test
    for (i = ka.length - 1; i >= 0; i--) {
        key = ka[i];
        if (!isEqual(a[key], b[key], opts)) return false;
    }
    return typeof a === typeof b;
}

function _prune(input: StringIndexableObject) {
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
    }
    return pruned;
}

function prune(obj: StringIndexableObject) {
    _prune(obj);
    return obj;
}

function plain(obj: any) {
    return JSON.parse(JSON.stringify(obj));
}

function clone(input: any): any {
    return retrocycle(decycle(input));
}

function arrayify(val: any): any[] {
    if (check(val, Array)) {
        return val;
    }
    return [val];
}

function isEmpty(input: StringIndexableObject) {
    const ref = input;
    if (!check(input, Object)) {
        throw new Error('checking non object for non-empty keys');
    }
    let containsValid = false;
    for (const k of Object.keys(ref)) {
        if (check(ref[k], 'any')) {
            containsValid = true;
        }
    }
    return !containsValid;
}

function reduce<T, S>(input: Array<T>, fn: (input: T, memo: S) => S, base?: S): S
function reduce<T, S>(input: { [index: string]: T }, fn: (input: T, memo: S) => S, base?: S): S {
    let sum: S = base;
    each(input, (value: T) => {
        sum = fn(value, sum)
    });
    return sum;
}

function okmap(iterable: Object | Array<any>, fn: Function) {
    const sum: StringIndexableObject = {};
    each(iterable, (v: any, k: any) => {
        const res = fn(v, k);
        const key = Object.keys(res)[0];
        sum[key] = res[key];
    });
    return sum;
}


function stringify(value: any, replacer?: (number | string)[],
    space?: string | number): string {
    return JSON.stringify(decycle(value), replacer, space || 2);
}

export { isEqual, each, map, every, tally, any, contains, containsAny, containsAll, extend, combine, prune, plain, clone, arrayify, union, intersect, difference, reduce, okmap, stringify };