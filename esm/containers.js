import { check, isEmpty, MapLike } from './check';
import { decycle } from './decycle';
import { mergeOrReturnAssignment } from './merge';
import { every, Mutate } from './arrays';
export const set = (t, [k, v]) => {
    if (t instanceof Map) {
        t.set(k, v);
    }
    else {
        t[k] = v;
    }
};
export const unset = (t, k) => {
    if (t instanceof Map) {
        t.delete(k);
    }
    else {
        delete t[k];
    }
};
export const get = (s, k) => (s instanceof Map) ?
    s.get(k)
    :
        s[k];
export function each(iter, fn) {
    let broken = 0;
    const breakLoop = (() => { broken = 1; });
    if (Array.isArray(iter)) {
        let index = 0;
        for (const v of iter) {
            fn(v, index, breakLoop);
            if (broken) {
                return;
            }
            index++;
        }
    }
    else if (iter instanceof Map) {
        for (const [k, v] of iter) {
            fn(v, k, breakLoop);
            if (broken) {
                return;
            }
        }
    }
    else {
        for (const k of Object.keys(iter)) {
            fn(iter[k], k, breakLoop);
            if (broken) {
                return;
            }
        }
    }
}
export function replace(target, source) {
    each(source, (v, k) => unset(target, k));
    return extend(target, source);
}
export function extend(target, source) {
    if (check(source, MapLike)) {
        return extendN(target, source);
    }
    return target;
}
export function extendOwn(target, source) {
    each(source, (rhs, key) => {
        const lhs = get(target, key);
        if (check(lhs, MapLike) && check(rhs, MapLike)) {
            extendOwn(lhs, rhs);
        }
        else if (lhs) {
            set(target, [key, clone(get(source, key))]);
        }
    });
    return target;
}
export function existentialExtend(target, source) {
    each(source, (v, key) => {
        const lhs = get(target, key);
        const rhs = get(source, key);
        if (!lhs) {
            set(target, [key, clone(rhs)]);
        }
        else if (check(lhs, MapLike) && check(rhs, MapLike)) {
            existentialExtend(lhs, rhs);
        }
    });
    return target;
}
export function extendN(target, ...sources) {
    for (const source of sources) {
        each(source, (v, k) => set(target, [k, v]));
    }
    return target;
}
export function flatten(arr) {
    let stack = [];
    for (const v of arr) {
        if (check(v, Array)) {
            Mutate.concat(stack, flatten(v));
        }
        else {
            stack.push(v);
        }
    }
    return stack;
}
export function keysAndValues(object) {
    const keys = [];
    const values = [];
    each(object, (v, k) => {
        keys.push(k);
        values.push(v);
    });
    return { keys, values };
}
export function assign(a, b) {
    let result = clone(a);
    return extend(result || {}, clone(b));
}
export function combine(a, b) {
    let result = clone(a);
    return extend(result || {}, clone(b));
}
export function combineN(retType, ...args) {
    const result = clone(retType);
    for (const dict of args) {
        if (check(dict, Object)) {
            extend(result, dict);
        }
    }
    return result;
}
export function merge(target, setter, state) {
    const res = mergeOrReturnAssignment({
        data: target, state: Object.assign({ merge: {
                operator: '|'
            } }, state)
    }, setter).data;
    if (res || check(res, Number)) {
        return res;
    }
    return target;
}
export function mergeN(target, ...args) {
    for (const dict of args) {
        if (check(dict, Object)) {
            merge(target, dict);
        }
    }
    return target;
}
export function or(a, b) {
    const ret = clone(a);
    each(b, (v, k) => {
        ret[k] = a[k] || b[k];
    });
    return ret;
}
export function any(iter, fn) {
    if (check(iter, Array)) {
        let index = 0;
        for (const v of iter) {
            if (fn(v, index)) {
                return true;
            }
            index++;
        }
    }
    if (check(iter, Object)) {
        for (const k of Object.keys(iter)) {
            if (fn(iter[k], k)) {
                return true;
            }
        }
    }
    return false;
}
export function map(iter, fn) {
    const res = [];
    if (check(iter, Array)) {
        let i = 0;
        for (const v of iter) {
            res.push(fn(v, i));
            i++;
        }
    }
    if (check(iter, Object)) {
        for (const k of Object.keys(iter)) {
            res.push(fn(iter[k], k));
        }
    }
    return res;
}
export function amap(iter, fn) {
    const arr = [];
    if (check(iter, Array)) {
        let i = 0;
        for (const v of iter) {
            arr.push(fn(v, i));
            i++;
        }
    }
    if (check(iter, Object)) {
        for (const k of Object.keys(iter)) {
            arr.push(fn(iter[k], k));
        }
    }
    return Promise.all(arr);
}
export function reduce(input, fn, base) {
    let sum = base;
    each(input, (value) => {
        sum = fn(value, sum);
    });
    return sum;
}
export function sum(input, fn) {
    let sum = 0;
    each(input, (value) => {
        sum = sum + fn(value);
    });
    return sum;
}
export function greatestResult(input, fn) {
    let greatestResult = 0;
    each(input, (value) => {
        const res = fn(value);
        if (res > greatestResult)
            greatestResult = res;
    });
    return greatestResult;
}
export function sumIfEvery(input, fn) {
    let sum = 0;
    each(input, (value, index, breakLoop) => {
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
export function geoSum(input, fn) {
    let sum = 1;
    each(input, (value, key, breakLoop) => {
        sum *= fn(value, sum);
    });
    return sum;
}
function _prune(input) {
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
    });
    return pruned;
}
export function prune(obj) {
    _prune(obj);
    return obj;
}
export function clean(obj) {
    for (const key of Object.keys(obj)) {
        delete obj[key];
    }
    return obj;
}
export function plain(obj) {
    return JSON.parse(JSON.stringify(obj));
}
function ObjectAssign(target, source) {
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
export function clone(obj, stacktrace = [], addr = []) {
    var copy;
    // Handle the 3 simple types, and null or undefined
    if (null == obj || ("object" != typeof obj))
        return obj;
    each(addr, (ptr) => {
        each(obj, (v, key) => {
            if (ptr === v) {
                throw new Error(`terminate recursive clone @ ${key}; ${v} = ${ptr} stack: ${stacktrace.join('.')}, addr: ${addr}}`);
            }
        });
    });
    // Handle Date
    if (obj instanceof Date) {
        copy = new Date();
        copy.setTime(obj.getTime());
        return copy;
    }
    // Handle Array
    else if (obj instanceof Array) {
        copy = [];
        for (var i = 0, len = obj.length; i < len; i++) {
            copy[i] = clone(obj[i], [...stacktrace, `[${i}]`], [...addr, obj]);
        }
        return copy;
    }
    // Handle Map
    else if (obj instanceof Map) {
        copy = new Map();
        for (const [k, v] of obj) {
            copy.set(k, clone(v, [...stacktrace, `[${i}]`], [...addr, obj]));
        }
        return copy;
    }
    // force to handle as object even if instanceof Object returns null i.e. Object.create(null)
    else {
        let copy = {};
        if (obj != null) {
            if (obj.clone) {
                try {
                    return obj.clone(obj);
                }
                catch (e) {
                    throw new Error(`${typeof obj} instance: clone(${obj}) failed`);
                }
            }
            else if (obj.constructor) {
                try {
                    copy = new (obj.constructor)();
                }
                catch (e) {
                    throw new Error(`Error while cloning a(n) [ ${typeof obj} ] instance: ${JSON.stringify(obj)}`);
                    // throw new Error(`${typeof obj} instance: ${from.constructor}() failed: ${e.message}`);
                }
            }
            each(obj, (v, key) => {
                copy[key] = clone(v, [...stacktrace, key], [...addr, obj]);
            });
        }
        return copy;
    }
}
// export function okmap<R, I, IType extends TJT.Iterable<I>, RType extends R[]>(iterable: IType, fn: (v: I, k?: string | number) => {[index: number]: R}): RType
export function okmap(iterable, fn) {
    const o = {};
    const a = [];
    each(iterable, (_v, _k) => {
        let k = _k;
        let v = fn(_v, k);
        if (check(v, Object)) {
            const keys = Object.keys(v);
            if (keys.length == 2 && (keys[0] == 'key' || keys[1] == 'key')) {
                k = v.key;
                v = v.value;
            }
        }
        o[k] = v;
        if (k >= 0) {
            a[k] = v;
        }
    });
    if (every(Object.keys(o), (k) => check(k, Number)))
        return a;
    return o;
}
function createAokPromise(_v, _k, fn) {
    let key = _k;
    return new Promise((resolve, reject) => {
        return Promise.resolve(fn(_v, key)).then(value => {
            if (check(value, Object)) {
                const keys = Object.keys(value);
                if (keys.length == 2 && (keys[0] == 'key' || keys[1] == 'key')) {
                    key = value.key;
                    value = value.value;
                }
            }
            return resolve({ key, value });
        }, (e) => reject(e)).catch((e) => reject(e));
    });
}
;
export function aokmap(iterable, fn) {
    const pa = [];
    each(iterable, (_v, _k) => {
        pa.push(createAokPromise(_v, _k, fn));
    });
    return Promise.all(pa).then((resolved) => {
        if (every(resolved, (kv) => check(kv.key, Number))) {
            const r = [];
            each(resolved, (kv) => {
                r[kv.key] = kv.value;
            });
            return Promise.resolve(r);
        }
        else {
            const r = {};
            each(resolved, (kv) => {
                r[kv.key] = kv.value;
            });
            return Promise.resolve(r);
        }
    });
}
// const createAokPromise = async <I, R>(_v: I, _k: string, fn: any) => {
//     let key = _k;
//     let value = await fn(_v, key);
//     if (check(value, Object)) {
//         const keys = Object.keys(value);
//         if (keys.length == 2 && (keys[0] == 'key' || keys[1] == 'key')) {
//             key = (<any>value).key;
//             value = <R>(<any>value).value;
//         }
//     }
//     return { key, value }
// };
// export const aokmap = async <R, I, IObject extends { [index: string]: I }>(iterable: IObject | Array<I>, fn: (v: I, k?: string | number) => R | PromiseLike<R>) => {
//     const pa = <PromiseLike<any>[]>[];
//     each(iterable, (_v: I, _k: string) => {
//         pa.push(createAokPromise<I, R>(_v, _k, fn));
//     });
//     const resolved = await Promise.all(pa);
//     if (every(resolved, (kv) => check(kv.key, Number))) {
//         const r: any = [];
//         for (const kv of resolved) {
//             r[kv.key] = kv.value;
//         }
//         return r;
//     } else {
//         const r: any = {};
//         for (const kv of resolved) {
//             r[kv.key] = kv.value;
//         }
//         return r;
//     }
// }
export function stringify(value, replacer, space) {
    return JSON.stringify(decycle(value), replacer, space || 2);
}
//# sourceMappingURL=containers.js.map