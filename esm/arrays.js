import { check, isEqual } from './check';
export const compareAndFilter = (arr1, arr2, fn, filter) => {
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
export function every(iter, fn) {
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
export const all = every;
export var Mutate;
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
})(Mutate || (Mutate = {}));
export function union(...args) {
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
export function concat(...args) {
    const res = [];
    for (const arr of args) {
        for (const v of arr) {
            res.push(v);
        }
    }
    return res;
}
export function intersect(...args) {
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
export function difference(a, b) {
    const res = [];
    for (const v of a) {
        if (!contains(b, v)) {
            res.push(v);
        }
    }
    return res;
}
export function arrayify(val) {
    if (check(val, Array)) {
        return val;
    }
    return [val];
}
export function contains(set, toMatch) {
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
export function containsAny(set, match) {
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
export function containsAll(set, match) {
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
//# sourceMappingURL=arrays.js.map