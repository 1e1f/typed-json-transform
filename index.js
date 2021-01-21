(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory((global.index = global.index || {}, global.index.js = {})));
}(this, (function (exports) { 'use strict';

    function check(val, type) {
        if (_c(type, Array)) {
            for (const sType of type) {
                if (_c(val, sType)) {
                    return true;
                }
            }
            return false;
        }
        // if (type && type.prototype) { console.log(new Error().stack); return val && val.prototype == type.prototype; }
        return _c(val, type);
    }
    const MapLike = 'MapLike';
    function _c(val, type) {
        switch (type) {
            case Array:
            case 'Array':
                return Array.isArray(val);
            case Date:
            case 'Date':
                return val !== undefined && val instanceof Date;
            case MapLike:
            case 'MapLike':
                return (val instanceof Map) || _c(val, Object);
            case Map:
            case 'Map':
                return val instanceof Map;
            case Object:
            case 'Object':
                return val !== null && typeof val === 'object' && !_c(val, Date) && !_c(val, Array) && !_c(val, Error);
            case String:
            case 'String':
                return typeof val === 'string';
            case Number:
            case 'Number':
                return isNumeric(val);
            case Function:
            case 'Function':
                return (val !== null && typeof val === 'function');
            case Boolean:
            case 'Boolean':
                return typeof val === 'boolean';
            case Number:
            case 'Number':
                return isNumeric(val);
            case 'undefined':
            case undefined:
            case 'Undefined':
                return val === undefined;
            case null:
                return val === null;
            case Error:
            case 'Error':
                return val instanceof Error;
            case 'any':
                return (val !== null && val !== undefined) || isNumeric(val);
            default:
                return val !== undefined && (val.constructor === type || val.prototype == type.prototype);
        }
    }
    const isNumeric = (n) => !isNaN(parseFloat(n)) && isFinite(n);
    const isArguments = (object) => Object.prototype.toString.call(object) == '[object Arguments]';
    function isEmpty(input) {
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
    const isUndefinedOrNull = (value) => value === null || value === undefined;
    function isBuffer(x) {
        if (!x || typeof x !== 'object' || typeof x.length !== 'number')
            return false;
        if (typeof x.copy !== 'function' || typeof x.slice !== 'function') {
            return false;
        }
        if (x.length > 0 && typeof x[0] !== 'number')
            return false;
        return true;
    }
    function isEqual(a, e, opts) {
        // http://wiki.commonjs.org/wiki/Unit_Testing/1.0
        if (!opts)
            opts = {};
        // 7.1. All identical values are equivalent, as determined by ===.
        if (a === e) {
            return true;
        }
        else if (a instanceof Date && e instanceof Date) {
            return a.getTime() === e.getTime();
            // 7.3. Other pairs that do not both pass typeof value == 'object',
            // equivalence is determined by ==.
        }
        else if (!a || !e || typeof a != 'object' && typeof e != 'object') {
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
    const compareBuffer = (a, b) => {
        if (a.length !== b.length)
            return false;
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i])
                return false;
        }
        return true;
    };
    function _objEquiv(a, b, opts) {
        if (isUndefinedOrNull(a) || isUndefinedOrNull(b))
            return false;
        // an identical 'prototype' property.
        if (a.prototype !== b.prototype)
            return false;
        //~~~I've managed to break Object.keys through screwy arguments passing.
        //   Converting to array solves the problem.
        if (isArguments(a)) {
            if (!isArguments(b))
                return false;
            a = pSlice.call(a);
            b = pSlice.call(b);
            return isEqual(a, b, opts);
        }
        if (isBuffer(a)) {
            if (!isBuffer(b))
                return false;
            return compareBuffer(a, b);
        }
        let ka, kb;
        try {
            ka = Object.keys(a);
            kb = Object.keys(b);
        }
        catch (e) { //happens when one is a string literal and the other isn't
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
        for (let i = ka.length - 1; i >= 0; i--) {
            if (ka[i] != kb[i])
                return false;
        }
        //equivalent values for every corresponding key, and
        //~~~possibly expensive deep test
        for (let i = ka.length - 1; i >= 0; i--) {
            const key = ka[i];
            if (!isEqual(a[key], b[key], opts))
                return false;
        }
        return typeof a === typeof b;
    }

    function decycle(object) {
        const objects = []; // Keep a reference to each unique object or array
        const paths = []; // Keep the path to each unique object or array
        return (function derez(value, path) {
            // The derez recurses through the object, producing the deep copy.
            let i; // The loop counter
            let name; // Property name
            let nu;
            // typeof null === 'object', so go on if this value is really an object but not
            // one of the weird builtin objects.
            if (value != undefined && value instanceof Date) {
                return new Date(value.valueOf());
            }
            if (typeof value === 'object' && value !== null) {
                // If the value is an object or array, look to see if we have already
                // encountered it. If so, return a $ref/path object. This is a hard way,
                // linear search that will get slower as the number of unique objects grows.
                for (i = 0; i < objects.length; i += 1) {
                    if (objects[i] === value) {
                        return { $ref: paths[i] };
                    }
                }
                // Otherwise, accumulate the unique value and its path.
                objects.push(value);
                paths.push(path);
                // If it is an array, replicate the array.
                if (Object.prototype.toString.apply(value) === '[object Array]') {
                    nu = [];
                    for (i = 0; i < value.length; i += 1) {
                        nu[i] = derez(value[i], path + '[' + i + ']');
                    }
                }
                else {
                    // If it is an object, replicate the object.
                    nu = {};
                    for (name in value) {
                        if (Object.prototype.hasOwnProperty.call(value, name)) {
                            nu[name] = derez(value[name], path + '[' + JSON.stringify(name) + ']');
                        }
                    }
                }
                return nu;
            }
            return value;
        }(object, '$'));
    }

    const compareAndFilter = (arr1, arr2, fn, filter) => {
        const ret = [];
        for (let i = 0; i < arr1.length; i++) {
            const a = arr1[i];
            const b = arr2[i];
            const v = fn(a, b);
            if (v || (check(v, Number)))
                ret.push(v);
        }
        return ret;
    };
    function every(iter, fn) {
        if (check(iter, Array)) {
            let index = 0;
            if (!iter.length)
                return false;
            for (const v of iter) {
                if (!fn(v, index)) {
                    return false;
                }
                index++;
            }
        }
        if (check(iter, Object)) {
            const keys = Object.keys(iter);
            if (!keys.length)
                return false;
            for (const k of keys) {
                if (!fn(iter[k], k)) {
                    return false;
                }
            }
        }
        return true;
    }
    const all = every;
    (function (Mutate) {
        function concat(...args) {
            const [input, ...rest] = args;
            for (const arr of rest) {
                for (const v of arr) {
                    input.push(v);
                }
            }
        }
        Mutate.concat = concat;
        function assign(a, b) {
            a.length = 0;
            concat(a, b);
        }
        Mutate.assign = assign;
        function deduplicate(input) {
            const res = [];
            for (const v of input) {
                if (!contains(res, v)) {
                    res.push(v);
                }
            }
            assign(input, res);
        }
        Mutate.deduplicate = deduplicate;
        function union(...args) {
            const [input, ...rest] = args;
            deduplicate(input);
            for (const arr of rest) {
                for (const v of arr) {
                    if (!contains(input, v)) {
                        input.push(v);
                    }
                }
            }
        }
        Mutate.union = union;
        function intersect(...args) {
            const res = [];
            for (const a of args) {
                for (const v of a) {
                    if (!contains(res, v)) {
                        if (every(args, (b) => {
                            if (isEqual(b, a, { strict: true })) {
                                return true;
                            }
                            return contains(b, v) > 0;
                        })) {
                            res.push(v);
                        }
                    }
                }
            }
            assign(args[0], res);
        }
        Mutate.intersect = intersect;
        function difference(a, b) {
            const res = [];
            for (const v of b) {
                if (!contains(a, v)) {
                    res.push(v);
                }
            }
            assign(a, res);
        }
        Mutate.difference = difference;
        function subtract(a, b) {
            const res = [];
            for (const v of a) {
                if (!contains(b, v)) {
                    res.push(v);
                }
            }
            assign(a, res);
        }
        Mutate.subtract = subtract;
        function xor(a, b) {
            const res = [];
            for (const v of a) {
                if (!contains(b, v)) {
                    res.push(v);
                }
            }
            for (const v of b) {
                if (!contains(a, v)) {
                    res.push(v);
                }
            }
            assign(a, res);
        }
        Mutate.xor = xor;
        Mutate.compareAndFilter = (arr1, arr2, fn, filter) => {
            const ret = [];
            for (let i = 0; i < arr1.length; i++) {
                const a = arr1[i];
                const b = arr2[i];
                const v = fn(a, b);
                if (v || (check(v, Number)))
                    ret.push(v);
            }
            assign(arr1, ret);
        };
    })(exports.Mutate || (exports.Mutate = {}));
    function union(...args) {
        const res = [];
        for (const arr of args) {
            for (const v of arr) {
                if (!contains(res, v)) {
                    res.push(v);
                }
            }
        }
        return res;
    }
    function concat(...args) {
        const res = [];
        for (const arr of args) {
            for (const v of arr) {
                res.push(v);
            }
        }
        return res;
    }
    function intersect(...args) {
        const res = [];
        for (const a of args) {
            for (const v of a) {
                if (!contains(res, v)) {
                    if (every(args, (b) => {
                        if (isEqual(b, a, { strict: true })) {
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
    function difference(a, b) {
        const res = [];
        for (const v of a) {
            if (!contains(b, v)) {
                res.push(v);
            }
        }
        return res;
    }
    function arrayify(val) {
        if (check(val, Array)) {
            return val;
        }
        return [val];
    }
    function contains(set, toMatch) {
        if (check(toMatch, Array)) {
            return containsAny(set, toMatch);
        }
        let matches = 0;
        for (const val of set) {
            if (isEqual(val, toMatch, { strict: true })) {
                matches++;
            }
        }
        return matches;
    }
    function containsAny(set, match) {
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
    function containsAll(set, match) {
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

    const set = (t, [k, v]) => {
        if (t instanceof Map) {
            t.set(k, v);
        }
        else {
            t[k] = v;
        }
    };
    const unset = (t, k) => {
        if (t instanceof Map) {
            t.delete(k);
        }
        else {
            delete t[k];
        }
    };
    const get = (s, k) => (s instanceof Map) ?
        s.get(k)
        :
            s[k];
    function each(iter, fn) {
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
    const mapToObject = (input) => {
        const out = {};
        each(input, (value, key) => {
            if (typeof value == 'object') {
                out[key] = mapToObject(value);
            }
            else {
                out[key] = value;
            }
        });
        return out;
    };
    function map(iter, fn) {
        const res = [];
        if (Array.isArray(iter)) {
            let i = 0;
            for (const v of iter) {
                res.push(fn(v, i));
                i++;
            }
        }
        else if (Object.keys(iter)) {
            for (const k of Object.keys(iter)) {
                res.push(fn(iter[k], k));
            }
        }
        return res;
    }
    function replace(target, source) {
        each(source, (v, k) => unset(target, k));
        return extend(target, source);
    }
    function extend(target, source) {
        if (check(source, MapLike)) {
            return extendN(target, source);
        }
        return target;
    }
    function extendOwn(target, source) {
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
    function existentialExtend(target, source) {
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
    function extendN(target, ...sources) {
        for (const source of sources) {
            each(source, (v, k) => set(target, [k, v]));
        }
        return target;
    }
    function flatten(arr) {
        let stack = [];
        for (const v of arr) {
            if (check(v, Array)) {
                exports.Mutate.concat(stack, flatten(v));
            }
            else {
                stack.push(v);
            }
        }
        return stack;
    }
    function keysAndValues(object) {
        const keys = [];
        const values = [];
        each(object, (v, k) => {
            keys.push(k);
            values.push(v);
        });
        return { keys, values };
    }
    function assign(a, b) {
        let result = clone(a);
        return extend(result || {}, clone(b));
    }
    function combine(a, b) {
        let result = clone(a);
        return extend(result || {}, clone(b));
    }
    function combineN(retType, ...args) {
        const result = clone(retType);
        for (const dict of args) {
            if (check(dict, Object)) {
                extend(result, dict);
            }
        }
        return result;
    }
    function or(a, b) {
        const ret = clone(a);
        each(b, (v, k) => {
            ret[k] = a[k] || b[k];
        });
        return ret;
    }
    function any(iter, fn) {
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
    function amap(iter, fn) {
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
    function reduce(input, fn, base) {
        let sum = base;
        each(input, (value) => {
            sum = fn(value, sum);
        });
        return sum;
    }
    function sum(input, fn) {
        let sum = 0;
        each(input, (value) => {
            sum = sum + fn(value);
        });
        return sum;
    }
    function greatestResult(input, fn) {
        let greatestResult = 0;
        each(input, (value) => {
            const res = fn(value);
            if (res > greatestResult)
                greatestResult = res;
        });
        return greatestResult;
    }
    function sumIfEvery(input, fn) {
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
    function geoSum(input, fn) {
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
    function prune(obj) {
        _prune(obj);
        return obj;
    }
    function clean(obj) {
        for (const key of Object.keys(obj)) {
            delete obj[key];
        }
        return obj;
    }
    function plain(obj) {
        return JSON.parse(JSON.stringify(obj));
    }
    function clone(obj, stacktrace = [], addr = []) {
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
    function okmap(iterable, fn) {
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
    function aokmap(iterable, fn) {
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
    function stringify(value, replacer, space) {
        return JSON.stringify(decycle(value), replacer, space || 2);
    }

    /*
    this libary is a TypeScript port of a js library written by Jim Riecken
    https://github.com/jriecken/dependency-graph
    */
    class Graph {
        constructor() {
            this.nodes = {};
            this.outgoingEdges = {}; // Node -> [Dependency Node]
            this.incomingEdges = {}; // Node -> [Dependant Node]
        }
        addNode(node, data) {
            if (!this.hasNode(node)) {
                if (arguments.length === 2) {
                    this.nodes[node] = data;
                }
                else {
                    this.nodes[node] = node;
                }
                this.outgoingEdges[node] = [];
                this.incomingEdges[node] = [];
            }
        }
        removeNode(node) {
            if (this.hasNode(node)) {
                delete this.nodes[node];
                delete this.outgoingEdges[node];
                delete this.incomingEdges[node];
                [this.incomingEdges, this.outgoingEdges].forEach(function (edgeList) {
                    Object.keys(edgeList).forEach(function (key) {
                        var idx = edgeList[key].indexOf(node);
                        if (idx >= 0) {
                            edgeList[key].splice(idx, 1);
                        }
                    }, this);
                });
            }
        }
        hasNode(node) {
            return this.nodes.hasOwnProperty(node);
        }
        getNodeData(node) {
            if (this.hasNode(node)) {
                return this.nodes[node];
            }
            else {
                throw new Error(`Node does not exist: ${node}`);
            }
        }
        setNodeData(node, data) {
            if (this.hasNode(node)) {
                this.nodes[node] = data;
            }
            else {
                throw new Error(`Node does not exist: ${node}`);
            }
        }
        addDependency(from, to) {
            if (!this.hasNode(from)) {
                throw new Error(`Node does not exist: ${from}`);
            }
            if (!this.hasNode(to)) {
                throw new Error(`Node does not exist: ${to}`);
            }
            if (this.outgoingEdges[from].indexOf(to) === -1) {
                this.outgoingEdges[from].push(to);
            }
            if (this.incomingEdges[to].indexOf(from) === -1) {
                this.incomingEdges[to].push(from);
            }
            return true;
        }
        removeDependency(from, to) {
            var idx;
            if (this.hasNode(from)) {
                idx = this.outgoingEdges[from].indexOf(to);
                if (idx >= 0) {
                    this.outgoingEdges[from].splice(idx, 1);
                }
            }
            if (this.hasNode(to)) {
                idx = this.incomingEdges[to].indexOf(from);
                if (idx >= 0) {
                    this.incomingEdges[to].splice(idx, 1);
                }
            }
        }
        dependenciesOf(node, leavesOnly) {
            if (this.hasNode(node)) {
                var result = [];
                var DFS = createDFS(this.outgoingEdges, leavesOnly, result);
                DFS(node);
                var idx = result.indexOf(node);
                if (idx >= 0) {
                    result.splice(idx, 1);
                }
                return result;
            }
            else {
                throw new Error('Node does not exist: ' + stringify(node));
            }
        }
        dependantsOf(node, leavesOnly) {
            if (this.hasNode(node)) {
                var result = [];
                var DFS = createDFS(this.incomingEdges, leavesOnly, result);
                DFS(node);
                var idx = result.indexOf(node);
                if (idx >= 0) {
                    result.splice(idx, 1);
                }
                return result;
            }
            else {
                throw new Error('Node does not exist: ' + stringify(node));
            }
        }
        overallOrder(leavesOnly) {
            var self = this;
            var result = [];
            var keys = Object.keys(this.nodes);
            if (keys.length === 0) {
                return result; // Empty graph
            }
            else {
                // Look for cycles - we run the DFS starting at all the nodes in case there
                // are several disconnected subgraphs inside this dependency graph.
                const CycleDFS = createDFS(this.outgoingEdges, false, []);
                for (const nodeName of keys) {
                    CycleDFS(nodeName);
                }
                const DFS = createDFS(this.outgoingEdges, leavesOnly, result);
                // Find all potential starting points (nodes with nothing depending on them) an
                // run a DFS starting at these points to get the order
                const nodeNames = keys.filter(nodeName => self.incomingEdges[nodeName].length === 0);
                for (const nodeName of nodeNames) {
                    DFS(nodeName);
                }
                return result;
            }
        }
    }
    function createDFS(edges, leavesOnly, result) {
        var currentPath = [];
        var visited = {};
        const DFS = (currentNode) => {
            visited[currentNode] = true;
            currentPath.push(currentNode);
            for (const node of edges[currentNode]) {
                if (!visited[node]) {
                    DFS(node);
                }
                else if (currentPath.indexOf(node) >= 0) {
                    currentPath.push(node);
                    throw new Error('Dependency Cycle Found: ' + currentPath.join(' -> '));
                }
            }
            currentPath.pop();
            if ((!leavesOnly || edges[currentNode].length === 0) && result.indexOf(currentNode) === -1) {
                result.push(currentNode);
            }
        };
        return DFS;
    }

    class OLHV {
    }
    class OLHM {
    }
    (function (OLHM) {
        function parse(object) {
            const map = new OLHM();
            for (const k of Object.keys(object)) {
                if (OLHV.is(object(k))) {
                    map[k] = object[k];
                }
                else {
                    map[k] = {
                        value: object[k]
                    };
                }
            }
            return map;
        }
        OLHM.parse = parse;
        function safe(olhm) {
            if (!olhm)
                return [];
            if (!check(olhm, Object)) {
                throw new Error('OLHM expects an object as input');
            }
            const keys = Object.keys(olhm);
            if (keys.length === 0) {
                return [];
            }
            // single key optimization
            if (keys.length === 1) {
                return [OLHV.safe(olhm[keys[0]])];
            }
            // 2 or more keys, scan for dependencies
            const graph = new Graph();
            for (const k of keys) {
                graph.addNode(k);
            }
            for (const k of keys) {
                if (OLHV.is(olhm[k])) {
                    graph.addDependency(k, olhm[k].require);
                }
            }
            // order based on dependencies
            const final = [];
            for (const k of graph.overallOrder()) {
                final.push(OLHV.safe(olhm[k]));
            }
            return final;
        }
        OLHM.safe = safe;
        function okmap(olhm, fn) {
            if (!check(olhm, Object)) {
                throw new Error('OLHM expects an object as input');
            }
            const keys = Object.keys(olhm);
            if (keys.length === 0) {
                return {};
            }
            const final = {};
            for (const k of keys) {
                const olhv = olhm[k];
                if (OLHV.is(olhv)) {
                    const ret = fn(olhv.value, k);
                    if (OLHV.is(ret)) {
                        final[k] = ret;
                    }
                    else {
                        final[k] = {
                            value: ret,
                            require: olhv.require
                        };
                    }
                }
                else {
                    final[k] = fn(olhv, k);
                }
            }
            return final;
        }
        OLHM.okmap = okmap;
        function map(olhm, fn) {
            if (!olhm)
                return [];
            if (!check(olhm, Object)) {
                throw new Error('OLHM expects an object as input');
            }
            const keys = Object.keys(olhm);
            if (keys.length === 0) {
                return [];
            }
            // single key optimization
            if (keys.length === 1) {
                return [fn(OLHV.safe(olhm[keys[0]]), keys[0])];
            }
            // 2 or more keys, scan for dependencies
            const graph = new Graph();
            for (const k of keys) {
                graph.addNode(k);
            }
            for (const k of keys) {
                if (OLHV.is(olhm[k])) {
                    graph.addDependency(k, olhm[k].require);
                }
            }
            // order based on dependencies
            const final = [];
            for (const k of graph.overallOrder()) {
                const res = fn(OLHV.safe(olhm[k]), k);
                final.push(res);
            }
            return final;
        }
        OLHM.map = map;
        function reduce(olhm, fn, iv) {
            const iterable = safe(olhm);
            let i = 0;
            for (const v of iterable) {
                iv = fn(iv, v, i);
                i++;
            }
            return iv;
        }
        OLHM.reduce = reduce;
    })(OLHM || (OLHM = {}));
    (function (OLHV) {
        function is(obj) {
            if (check(obj, Object)) {
                const keys = Object.keys(obj);
                return keys.length === 2 && containsAll(keys, ['require', 'value']);
            }
            return false;
        }
        OLHV.is = is;
        function safe(objOrVal) {
            if (is(objOrVal)) {
                return objOrVal.value;
            }
            return objOrVal;
        }
        OLHV.safe = safe;
    })(OLHV || (OLHV = {}));

    function setValueForKeyPath(value, keyPath, input) {
        let current = input;
        const keys = keyPath.split('.');
        for (let i = 0; i < keys.length - 1; i += 1) {
            const thisKey = keys[i];
            const nextKey = keys[i + 1];
            if (nextKey) {
                if (check(nextKey, Number)) {
                    if (Array.isArray(current)) {
                        if (!Array.isArray(current[parseInt(thisKey, 10)])) {
                            current[parseInt(thisKey, 10)] = [];
                        }
                    }
                    else if (!Array.isArray(current[thisKey])) {
                        current[thisKey] = [];
                    }
                }
                else if (Array.isArray(current)) {
                    if (!(current[parseInt(thisKey, 10)] !== null &&
                        typeof current[parseInt(thisKey, 10)] === 'object')) {
                        current[parseInt(thisKey, 10)] = {};
                    }
                }
                else if (!(current[thisKey] !== null &&
                    typeof current[thisKey] === 'object')) {
                    current[thisKey] = {};
                }
            }
            if (Array.isArray(current)) {
                current = current[parseInt(thisKey, 10)];
            }
            else {
                current = current[thisKey];
            }
        }
        const lastKey = keys[keys.length - 1];
        if (Array.isArray(current)) {
            current[parseInt(lastKey, 10)] = value;
        }
        else if (current !== null && typeof current === 'object') {
            current[lastKey] = value;
        }
    }
    function mergeValueAtKeypath(value, keyPath, obj) {
        // this function mutates obj
        const existing = valueForKeyPath(keyPath, obj);
        if (check(value, Object) && check(existing, Object)) {
            extend(existing, value);
        }
        else if (check(value, Array) && check(existing, Array)) {
            setValueForKeyPath(union(existing, value), keyPath, obj);
        }
        else {
            setValueForKeyPath(value, keyPath, obj);
        }
    }
    function valueForKeyPath(keyPath, input) {
        if (!input) {
            throw new Error('attempting to get valueForKeyPath on undefined object');
        }
        let current = input;
        const keys = keyPath.split('.');
        for (let i = 0; i < keys.length - 1; i += 1) {
            const key = keys[i];
            if (Array.isArray(current)) {
                if (!current[parseInt(key, 10)]) {
                    return undefined;
                }
                current = current[parseInt(key, 10)];
            }
            else if (current !== null && typeof current === 'object') {
                if (!current[key]) {
                    return undefined;
                }
                current = current[key];
            }
        }
        const lastKey = keys[keys.length - 1];
        if (Array.isArray(current)) {
            return current[parseInt(lastKey, 10)];
        }
        else if (current) {
            for (const k of Object.keys(current)) {
                if (k === lastKey) {
                    return current[lastKey];
                }
            }
        }
        return undefined;
    }
    function unsetKeyPath(keyPath, obj) {
        // this function mutates obj
        const keys = keyPath.split('.');
        let current = obj;
        for (let i = 0; i < keys.length - 1; i += 1) {
            const key = keys[i];
            if (Array.isArray(current)) {
                if (!current[parseInt(key, 10)]) {
                    return false;
                }
                current = current[parseInt(key, 10)];
            }
            else if (current !== null && typeof current === 'object') {
                if (!current[key]) {
                    return false;
                }
                current = current[key];
            }
        }
        const lastKey = keys[keys.length - 1];
        if (Array.isArray(current)) {
            const index = parseInt(lastKey, 10);
            if (current[index] !== undefined) {
                delete current[index];
                return true;
            }
            return false;
        }
        if (current[lastKey] !== undefined) {
            delete current[lastKey];
            return true;
        }
        return false;
    }
    function _keyPathContainsPath(keyPath, ignorePath) {
        const p = keyPath.split('.');
        const t = ignorePath.split('.');
        if (!(p.length > t.length)) {
            return false;
        }
        for (let i = 0; i < t.length; i += 1) {
            if (p[i] !== t[i]) {
                return false;
            }
        }
        return true;
    }
    function keyPathContainsPath(keyPath, ignorePath) {
        if (keyPath === ignorePath) {
            return true;
        }
        return _keyPathContainsPath(keyPath, ignorePath);
    }
    const lastKey = (kp) => {
        const parts = kp.split('.');
        if (parts.length) {
            return parts[parts.length - 1];
        }
        return kp;
    };
    function filteredKeyPaths(_keyPaths, ignore) {
        if (!ignore.length) {
            return _keyPaths;
        }
        const toFilter = [];
        for (const ignorePath of ignore) {
            for (const keyPath of _keyPaths) {
                if (keyPathContainsPath(keyPath, ignorePath)) {
                    toFilter.push(keyPath);
                }
            }
        }
        return difference(_keyPaths, toFilter);
    }
    function keyPaths(obj, _options, _stack, parent) {
        const stack = _stack || [];
        const options = clone(_options || {});
        const keys = Object.keys(obj);
        if (keys.length > 0) {
            for (const el of keys) {
                const val = obj[el];
                if (Array.isArray(val)) {
                    if (options.diffArrays) {
                        if (options.allLevels) {
                            stack.push(parent ? `${parent}.${el}` : el);
                        }
                        for (let i = 0; i < val.length; i += 1) {
                            const p = parent ? `${parent}.${el}.${i}` : `${el}.${i}`;
                            const s = val[i];
                            if (Array.isArray(s) || (s !== null && typeof s === 'object')) {
                                if (options.allLevels) {
                                    stack.push(p);
                                }
                                keyPaths(s, options, stack, p);
                            }
                            else {
                                stack.push(p);
                            }
                        }
                    }
                    else {
                        stack.push(parent ? `${parent}.${el}` : el);
                    }
                }
                else if (val instanceof Date) {
                    const key = parent ? `${parent}.${el}` : el;
                    stack.push(key);
                }
                else if (val !== null && typeof val === 'object') {
                    if (val instanceof Buffer || val instanceof RegExp) {
                        stack.push(parent ? `${parent}.${el}` : el);
                    }
                    else {
                        if (options.allLevels) {
                            stack.push(parent ? `${parent}.${el}` : el);
                        }
                        keyPaths(val, options, stack, parent ? `${parent}.${el}` : el);
                    }
                }
                else {
                    stack.push(parent ? `${parent}.${el}` : el);
                }
            }
        }
        else {
            stack.push(parent ? `${parent}` : '');
        }
        return stack;
    }
    function allKeyPaths(obj, options) {
        return keyPaths(obj, Object.assign({ allLevels: true, diffArrays: true }, options));
    }
    function flatObject(object, options) {
        const flat = {};
        for (const keyPath of keyPaths(object, options)) {
            flat[keyPath] = valueForKeyPath(keyPath, object);
        }
        return flat;
    }
    const unflatten = (source) => {
        const ret = {};
        each(source, (val, keyPath) => {
            if (val !== undefined) {
                setValueForKeyPath(val, keyPath, ret);
            }
        });
        return ret;
    };
    const conditionalUnflatten = (source) => {
        const ret = Object.assign({}, source);
        each(source, (val, explicitKp) => {
            if (val !== undefined) {
                if (explicitKp[0] === '~' && (explicitKp.indexOf('.') !== -1)) {
                    const kp = explicitKp.slice(1);
                    setValueForKeyPath(val, kp, ret);
                }
            }
        });
        return ret;
    };

    const startsWith = (string, s) => {
        return string.slice(0, s.length) === s;
    };
    const beginsWith = (string, s) => {
        return string.slice(0, s.length) === s;
    };
    const endsWith = (string, s) => {
        return s === string.slice(-s.length);
    };
    const replaceAll = (str, find, rep) => {
        const escaped = find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return str.replace(new RegExp(escaped, 'g'), rep);
    };
    const trim = (str) => {
        let ret = str;
        while (ret.length && ret[ret.length - 1] == ' ') {
            ret = ret.slice(0, ret.length - 1);
        }
        while (ret.length && ret[0] == ' ') {
            ret = ret.slice(1, ret.length);
        }
        return ret;
    };
    const toCamelDefaults = {};
    const toCamel = (input, options) => {
        const { delimiter, upperCase } = Object.assign(Object.assign({}, toCamelDefaults), options);
        const res = map(input.split(delimiter || " "), (word) => {
            return word.charAt(0).toUpperCase() + word.slice(1);
        }).join('');
        if (upperCase)
            return res;
        return res.charAt(0).toLowerCase() + res.slice(1);
    };
    const fromCamelDefaults = {
        upperCase: true
    };
    const fromCamel = (input, options) => {
        const { delimiter, upperCase, capitalize, capsLock } = Object.assign(Object.assign({}, fromCamelDefaults), options);
        var words = input.match(/[A-Za-z][a-z]*/g);
        var out = words;
        out = out.map((word) => {
            const firstLetter = word.charAt(0);
            return (capitalize || capsLock ? firstLetter.toUpperCase() : firstLetter.toLowerCase()) + (capsLock ? word.substring(1).toUpperCase() : word.substring(1));
        });
        const joined = out.join(delimiter || " ");
        if (upperCase) {
            return joined.charAt(0)
                .toUpperCase() + joined.substring(1);
        }
        return joined;
    };

    function deepSearch(object, keywords, selectors) {
        if (!object)
            return;
        if (!Object.keys(object).length)
            return object;
        const stack = [];
        each(keyPaths(object), (key) => {
            let filtered = key;
            const unfiltered = (key === null || key === void 0 ? void 0 : key.split('.')) || [];
            let level = 0;
            for (const k of unfiltered) {
                if (select(keywords, k)) {
                    const precedence = select(selectors, k);
                    if (precedence > 0) {
                        filtered = filtered.replace(`${k}.`, '').replace(`.${k}`, '');
                        level += precedence;
                    }
                    else {
                        return;
                    }
                }
            }
            if (!stack[level]) {
                stack[level] = {};
            }
            stack[level][filtered] = valueForKeyPath(key, object);
        });
        return stack;
    }
    function flatten$1(stack, fn) {
        const flat = {};
        const apply = fn || mergeValueAtKeypath;
        each(stack, (level, height) => {
            if (level) {
                each(level, (v, kp) => {
                    apply(v, kp, flat);
                });
            }
        });
        return flat;
    }
    function matchSelector(selectors, selectable) {
        if (startsWith(selectable, '!')) {
            return 1 * !contains(selectors, selectable.slice(1));
        }
        return 1 * contains(selectors, selectable);
    }
    function matchEvery(selectedList, selectorString) {
        if (selectorString.indexOf(' ') !== -1) {
            const selectables = selectorString.split(' ');
            return sumIfEvery(selectables, (selectable) => {
                return matchSelector(selectedList, selectable);
            });
        }
        return matchSelector(selectedList, selectorString);
    }
    function matchSelectorString(selectedList, selectorString) {
        const selectables = replaceAll(selectorString, ', ', ',');
        if (selectables.indexOf(',') !== -1) {
            return greatestResult(selectables.split(','), (subCssString) => {
                return matchEvery(selectedList, subCssString);
            });
        }
        return matchEvery(selectedList, selectables);
    }
    function select(input, cssString) {
        return matchSelectorString(input, cssString);
    }
    function extractKeywordsAndSelectors(options) {
        const keywords = [];
        const selectors = [];
        each(options, (opt, key) => {
            keywords.push(key);
            if (opt)
                selectors.push(key);
        });
        return {
            keywords, selectors
        };
    }
    function hashField(trie, options) {
        const { keywords, selectors } = extractKeywordsAndSelectors(options);
        const match = flatten$1(deepSearch(trie, keywords, selectors));
        const unselected = okmap(trie, (val) => {
            return false;
        });
        const selected = okmap(match, (val) => {
            return !!val;
        });
        return or(unselected, selected);
    }
    function cascade(tree, keywords, selectors, apply) {
        return flatten$1(deepSearch(tree, keywords, selectors), apply);
    }

    function shouldSet(val, prev) {
        if (Array.isArray(val)) {
            return !isEqual(prev, val);
        }
        else if (val instanceof Date) {
            if (prev instanceof Date) {
                return (val.getTime() !== prev.getTime());
            }
            return !!val.getTime();
        }
        else if (check(val, Number)) {
            return (prev !== val) || !check(prev, Number);
        }
        else if (val !== null && typeof val === 'object') {
            return !isEqual(prev, val);
        }
        else if (val) {
            return prev !== val;
        }
    }
    function shouldUnset(val, prev) {
        if (prev instanceof Date) {
            return !(val && val.getTime());
        }
        if ((prev || check(prev, Number)) && !(val || check(val, Number))) {
            return true;
        }
        if (val && typeof val === 'object') {
            if (!Object.keys(val).length) {
                return true;
            }
        }
        return false;
    }
    function diffToModifier(prev, doc, fieldsToIgnore, pruneEmptyObjects) {
        const delta = { $set: {}, $unset: {} };
        if (doc) {
            const forwardKeyPaths = filteredKeyPaths(keyPaths(doc), fieldsToIgnore || []);
            for (const keyPath of forwardKeyPaths) {
                const val = valueForKeyPath(keyPath, doc);
                if (shouldSet(val, valueForKeyPath(keyPath, prev))) {
                    delta.$set[keyPath] = val;
                }
            }
        }
        if (prev) {
            const kps = keyPaths(prev, { allLevels: true });
            const existingKeyPaths = filteredKeyPaths(kps, fieldsToIgnore || []);
            for (const keyPath of existingKeyPaths) {
                const curVal = valueForKeyPath(keyPath, doc);
                if (shouldUnset(curVal, valueForKeyPath(keyPath, prev))) {
                    delta.$unset[keyPath] = true;
                }
            }
            const modifier = delta.$unset;
            const keys = Object.keys(modifier);
            for (const pathA of keys) {
                for (const pathB of keys) {
                    if (_keyPathContainsPath(pathA, pathB)) {
                        delete modifier[pathA];
                    }
                }
            }
        }
        if (!Object.keys(delta.$set).length) {
            delete delta.$set;
        }
        if (!Object.keys(delta.$unset).length) {
            delete delta.$unset;
        }
        if (Object.keys(delta).length) {
            if (pruneEmptyObjects) {
                const newDelta = diffToModifier(prev, apply(clone(prev), delta), fieldsToIgnore, false);
                return newDelta || delta;
            }
            return delta;
        }
    }
    function modifierToObj(modifier) {
        if (modifier) {
            const obj = {};
            for (const keyPath of Object.keys(modifier.$set || {})) {
                const val = modifier.$set[keyPath];
                setValueForKeyPath(val, keyPath, obj);
            }
            for (const keyPath of Object.keys(modifier.$unset || {})) {
                setValueForKeyPath(undefined, keyPath, obj);
            }
            return obj;
        }
    }
    function objToModifier(obj) {
        return diffToModifier(null, obj);
    }
    function apply(dest, source) {
        if (!source) {
            return dest;
        }
        if (source.$set || source.$unset) {
            $set(dest, source);
            $unset(dest, source);
        }
        else {
            const mod = objToModifier(source);
            $set(dest, mod);
            $unset(dest, mod);
        }
        return prune(dest);
    }
    function $set(dest, source) {
        if (!source) {
            return;
        }
        if (source.$set || source.$unset) {
            $set(dest, source.$set);
        }
        return each(source, (val, keyPath) => {
            if (check(val, Number) || val) {
                setValueForKeyPath(val, keyPath, dest);
            }
        });
    }
    function $addToSet(dest, src) {
        if (!Array.isArray(dest)) {
            throw new Error('$addToSet, 1st arg not array');
        }
        if (!contains(dest, src)) {
            dest.push(src);
        }
        return dest;
    }
    function $unset(dest, source) {
        if (!source) {
            return;
        }
        if (source.$unset || source.$set) {
            $unset(dest, source.$unset);
        }
        each(source, (val, keyPath) => { unsetKeyPath(keyPath, dest); });
    }
    function update(doc, options) {
        let model;
        if (check(options.get, Function)) {
            model = options.get();
        }
        else if (doc._id && options.collection) {
            model = options.collection.findOne({ _id: doc._id });
        }
        if (!model) {
            throw new Error('Diff: no doc to diff against');
        }
        const diff = diffToModifier(model, doc, options.ignore);
        if (diff) {
            if (!options.set && !options.collection) {
                throw new Error('Diff: no setter provided');
            }
            if (check(options.set, Function)) {
                const copy = clone(model);
                apply(copy, diff);
                options.set(copy);
                if (!isEqual(copy, model)) {
                    throw new Error('Diff: not equal after update');
                }
            }
            else if (options.collection) {
                options.collection.update({ _id: model._id }, { $set: diff });
            }
        }
        return diff;
    }
    function mapModifierToKey(modifier, key) {
        if (!modifier) {
            throw new Error('called mapModifierToKey on undefined');
        }
        const valueModifier = {};
        for (const keyPath of Object.keys(modifier.$set || {})) {
            if (valueModifier.$set == null) {
                valueModifier.$set = {};
            }
            valueModifier.$set[`${key}.${keyPath}`] = modifier.$set[keyPath];
        }
        for (const keyPath of Object.keys(modifier.$unset || {})) {
            if (valueModifier.$unset == null) {
                valueModifier.$unset = {};
            }
            valueModifier.$unset[`${key}.${keyPath}`] = modifier.$set[keyPath];
        }
        return valueModifier;
    }

    const { concat: concat$1, subtract, difference: difference$1, intersect: intersect$1, union: union$1, xor, assign: assign$1, compareAndFilter: compareAndFilter$1 } = exports.Mutate;
    function _mergeArray(lhs, rhs, operator) {
        switch (operator) {
            case '=':
                assign$1(lhs, rhs);
                break;
            case '+':
                concat$1(lhs, rhs);
                break;
            case '-':
                subtract(lhs, rhs);
                break;
            case '!':
                difference$1(lhs, rhs);
                break;
            case '&':
                intersect$1(lhs, rhs);
                break;
            case '|':
                union$1(lhs, rhs);
                break;
            case '^':
                xor(lhs, rhs);
                break;
            case '?':
                compareAndFilter$1(lhs, rhs, (a, b) => a && b);
                break;
            case '*':
                compareAndFilter$1(lhs, rhs, (a, b) => b && a);
                break;
            default: throw new Error(`unhandled Array merge operator ${operator} lhs: ${lhs}`);
        }
    }
    function mergeLhsArray({ data: lhs, state }, rhs) {
        const { merge: { operator } } = state;
        if (check(rhs, Object)) {
            let mutated;
            const setter = conditionalUnflatten(rhs);
            for (const key of Object.keys(setter)) {
                if ((key.length === 2) && (key[0] === '<')) {
                    const nextState = Object.assign(Object.assign({}, state), { merge: {
                            operator: key[1]
                        } });
                    mutated = true;
                    mergeLhsArray({ data: lhs, state: nextState }, setter[key]).data;
                }
            }
            if (mutated) {
                return { data: undefined, state };
            }
        }
        else if (check(rhs, Array)) {
            recurArray({ data: null, state }, rhs);
            _mergeArray(lhs, rhs, operator);
            return { data: undefined, state };
        }
        switch (operator) {
            case '=': throw new Error('replacing array value with non-array value');
            default:
                _mergeArray(lhs, arrayify(rhs), operator);
                return { data: undefined, state };
        }
    }
    const doMerge = (lhs, operator, rhs, data, key, state) => {
        const assignment = mergeOrReturnAssignment({ data: lhs, state }, rhs).data;
        if (assignment !== undefined) { // we skip undefined becuase prev mergeOrReturnAssignment "pruned it"
            if (operator == '^') {
                if (data[key] === assignment)
                    delete data[key];
                else
                    data[key] = assignment;
            }
            else {
                data[key] = assignment;
            }
            // console.log('assigned:', assignment, 'next data:', data)
        }
        // else {
        //     console.log("didn't merge", data[key], "because", assignment, "<=", rhs)
        // }
    };
    function mergeLhsObject(rv, _setter) {
        const { state, data } = rv;
        const { merge: { operator } } = state;
        const setter = conditionalUnflatten(_setter);
        for (const key of Object.keys(setter)) {
            if ((key.length === 2) && (key[0] === '<')) {
                const nextState = Object.assign(Object.assign({}, state), { merge: {
                        operator: key[1]
                    } });
                const assignment = mergeOrReturnAssignment({ data, state: nextState }, setter[key]).data;
                if (assignment !== undefined) {
                    data[key] = assignment;
                }
            }
            else {
                const lhsValue = data[key];
                const rhs = setter[key];
                switch (operator) {
                    case '^':
                    case '|':
                    case '+':
                        doMerge(lhsValue, operator, rhs, data, key, state);
                        break;
                    case '=':
                        doMerge(lhsValue, operator, rhs, data, key, state);
                        break;
                    case '!':
                        if (lhsValue === undefined)
                            doMerge(lhsValue, operator, rhs, data, key, state);
                        break;
                    case '?':
                    case '&':
                    case '*':
                        if (lhsValue)
                            doMerge(lhsValue, operator, rhs, data, key, state);
                        break;
                    case '-':
                        if (rhs !== undefined)
                            delete data[key];
                        break;
                    default: throw new Error(`unhandled merge operator ${operator}`);
                }
                if (check(data, Object)) {
                    // rhs to lhs, clear not preset for assignment or mult.
                    for (const key of Object.keys(data)) {
                        const negRhs = setter[key];
                        switch (operator) {
                            case '=':
                                if (negRhs === undefined)
                                    delete data[key];
                                break;
                            case '&':
                            case '*':
                                if (!negRhs)
                                    delete data[key];
                                break;
                        }
                    }
                }
            }
        }
        return { data, state };
    }
    const printType = (val) => {
        if (check(val, Object)) {
            return 'object';
        }
        return val;
    };
    function throwIfImplicitConversion(rv, rhs) {
        const { data: lhs, state } = rv;
        const { operator } = state.merge;
        if ((lhs !== undefined) && (typeof lhs !== typeof rhs) && state.implicitTypeConversionError) {
            throw new Error(`implicit type change in ${printType(lhs)} ${operator} ${printType(rhs)}\n${JSON.stringify(rhs, null, 2)}`);
        }
    }
    const recurArray = (rv, rhs) => {
        const { state } = rv;
        rhs.forEach((val, index) => {
            const res = mergeOrReturnAssignment({ data: undefined, state: Object.assign(Object.assign({}, state), { merge: { operator: '=' } }) }, val).data;
            if (res !== undefined) {
                rhs[index] = res;
            }
        });
    };
    function mergeOrReturnAssignment(rv, rhs) {
        const { data: lhs, state } = rv;
        const { operator } = state.merge;
        if (check(lhs, Array)) {
            mergeLhsArray(rv, rhs);
        }
        else if (check(lhs, Object)) {
            // console.log(mergeOrReturnAssignment, rhs);
            if (check(rhs, Object)) {
                mergeLhsObject(rv, rhs);
            }
            else {
                if (contains(['&', '*', '-'], operator)) {
                    switch (operator) {
                        case '*':
                        case '&': if (rhs == null)
                            return { data: undefined, state };
                        case '-':
                            if (rhs)
                                delete lhs[rhs];
                            return { data: undefined, state };
                    }
                }
                return { data: rhs, state };
                // throwIfImplicitConversion(rv, rhs);
            }
        }
        else {
            if (check(rhs, Object)) {
                if (isMergeConstructor(rhs)) {
                    const obj = construct(rv, rhs).data;
                    return mergeOrReturnAssignment(rv, obj);
                }
                else {
                    throwIfImplicitConversion(rv, rhs);
                    let ret = { data: {}, state: Object.assign(Object.assign({}, state), { merge: { operator: '=' } }) };
                    mergeOrReturnAssignment(ret, rhs);
                    return ret;
                }
            }
            else if (check(rhs, Array)) {
                throwIfImplicitConversion(rv, rhs);
                recurArray(rv, rhs);
            }
            return { data: rhs, state };
        }
        return { data: undefined, state };
    }
    const isMergeConstructor = (val) => {
        for (const key of Object.keys(val)) {
            if ((key.length == 2) && (key[0] == '<')) {
                return true;
            }
        }
    };
    function construct(rv, constructor) {
        let data;
        const { state } = rv;
        for (const key of Object.keys(constructor)) {
            if ((key.length == 2) && (key[0] == '<')) {
                const nextOperator = key[1];
                const res = mergeOrReturnAssignment({
                    data,
                    state: {
                        merge: Object.assign(Object.assign({}, state.merge), { operator: nextOperator })
                    }
                }, constructor[key]).data;
                if (res || check(res, Number)) {
                    data = res;
                }
            }
        }
        return { data, state };
    }
    function merge(target, setter, state) {
        const res = mergeOrReturnAssignment({
            data: target,
            state: Object.assign({ merge: {
                    operator: '|'
                } }, state)
        }, setter).data;
        if (res || check(res, Number)) {
            return res;
        }
        return target;
    }
    function mergeN(target, ...args) {
        for (const dict of args) {
            if (check(dict, Object)) {
                merge(target, dict);
            }
        }
        return target;
    }

    exports.$addToSet = $addToSet;
    exports.$set = $set;
    exports.$unset = $unset;
    exports.Graph = Graph;
    exports.MapLike = MapLike;
    exports.OLHM = OLHM;
    exports.OLHV = OLHV;
    exports._keyPathContainsPath = _keyPathContainsPath;
    exports.all = all;
    exports.allKeyPaths = allKeyPaths;
    exports.amap = amap;
    exports.any = any;
    exports.aokmap = aokmap;
    exports.apply = apply;
    exports.arrayify = arrayify;
    exports.assign = assign;
    exports.beginsWith = beginsWith;
    exports.cascade = cascade;
    exports.check = check;
    exports.clean = clean;
    exports.clone = clone;
    exports.combine = combine;
    exports.combineN = combineN;
    exports.compareAndFilter = compareAndFilter;
    exports.concat = concat;
    exports.conditionalUnflatten = conditionalUnflatten;
    exports.construct = construct;
    exports.contains = contains;
    exports.containsAll = containsAll;
    exports.containsAny = containsAny;
    exports.diffToModifier = diffToModifier;
    exports.difference = difference;
    exports.each = each;
    exports.endsWith = endsWith;
    exports.every = every;
    exports.existentialExtend = existentialExtend;
    exports.extend = extend;
    exports.extendN = extendN;
    exports.extendOwn = extendOwn;
    exports.extractKeywordsAndSelectors = extractKeywordsAndSelectors;
    exports.filteredKeyPaths = filteredKeyPaths;
    exports.flatObject = flatObject;
    exports.flatten = flatten;
    exports.fromCamel = fromCamel;
    exports.geoSum = geoSum;
    exports.get = get;
    exports.greatestResult = greatestResult;
    exports.hashField = hashField;
    exports.intersect = intersect;
    exports.isArguments = isArguments;
    exports.isBuffer = isBuffer;
    exports.isEmpty = isEmpty;
    exports.isEqual = isEqual;
    exports.isMergeConstructor = isMergeConstructor;
    exports.isNumeric = isNumeric;
    exports.isUndefinedOrNull = isUndefinedOrNull;
    exports.keyPathContainsPath = keyPathContainsPath;
    exports.keyPaths = keyPaths;
    exports.keysAndValues = keysAndValues;
    exports.lastKey = lastKey;
    exports.map = map;
    exports.mapModifierToKey = mapModifierToKey;
    exports.mapToObject = mapToObject;
    exports.merge = merge;
    exports.mergeLhsArray = mergeLhsArray;
    exports.mergeLhsObject = mergeLhsObject;
    exports.mergeN = mergeN;
    exports.mergeOrReturnAssignment = mergeOrReturnAssignment;
    exports.mergeValueAtKeypath = mergeValueAtKeypath;
    exports.modifierToObj = modifierToObj;
    exports.objToModifier = objToModifier;
    exports.okmap = okmap;
    exports.or = or;
    exports.plain = plain;
    exports.prune = prune;
    exports.recurArray = recurArray;
    exports.reduce = reduce;
    exports.replace = replace;
    exports.replaceAll = replaceAll;
    exports.select = select;
    exports.set = set;
    exports.setValueForKeyPath = setValueForKeyPath;
    exports.startsWith = startsWith;
    exports.stringify = stringify;
    exports.sum = sum;
    exports.sumIfEvery = sumIfEvery;
    exports.toCamel = toCamel;
    exports.trim = trim;
    exports.unflatten = unflatten;
    exports.union = union;
    exports.unset = unset;
    exports.unsetKeyPath = unsetKeyPath;
    exports.update = update;
    exports.valueForKeyPath = valueForKeyPath;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
