import { check } from './check';
import { containsAll } from './arrays';
import { Graph } from './graph';
export class OLHV {
}
export class OLHM {
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
//# sourceMappingURL=olhm.js.map