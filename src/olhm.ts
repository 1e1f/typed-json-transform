import { check } from './check';
import { arrayify, containsAll, map as _map } from './containers';
import { Graph } from './graph';

export class OLHV<T> {
    require?: string;
    value: T
}

export class OLHM<T> {
    [index: string]: OLHV<T>;
}

export function parseOLHM(object: any): OLHM<any> {
    const map = new OLHM();
    for (const k of Object.keys(object)) {
        if (isOLHV(object(k))) {
            map[k] = object[k];
        } else {
            map[k] = {
                value: object[k]
            }
        }
    }
    return map;
}

export function safeOLHM<T>(olhm: OLHM<T>): T[] {
    if (!olhm) return [];
    if (!check(olhm, Object)) {
        throw new Error('OLHM expects an object as input')
    }
    const keys = Object.keys(olhm);
    if (keys.length === 0) {
        return [];
    }
    // single key optimization
    if (keys.length === 1) {
        return [safeOLHV(<any>olhm[keys[0]])];
    }
    // 2 or more keys, scan for dependencies
    const graph = new Graph();
    for (const k of keys) {
        graph.addNode(k);
    }
    for (const k of keys) {
        if (isOLHV(olhm[k])) {
            graph.addDependency(k, olhm[k].require);
        }
    }
    // order based on dependencies
    const final: T[] = [];
    for (const k of graph.overallOrder()) {
        final.push(safeOLHV(olhm[k]));
    }
    return final;
}

export function okmap<T>(olhm: OLHM<T>, fn: (v: any, k?: string) => OLHV<T> | T): OLHM<T> {
    if (!check(olhm, Object)) {
        throw new Error('OLHM expects an object as input')
    }
    const keys = Object.keys(olhm);
    if (keys.length === 0) {
        return {};
    }
    const final: OLHM<T> = {};
    for (const k of keys) {
        const olhv = olhm[k];
        if (isOLHV(olhv)) {
            const ret = <OLHV<T>>fn(olhv.value, k);
            if (isOLHV(ret)) {
                final[k] = ret;
            } else {
                final[k] = {
                    value: <T><any>ret,
                    require: olhv.require
                }
            }
        } else {
            final[k] = <OLHV<T>>fn(olhv, k);
        }
    }
    return final;
}

export function map<T>(olhm: OLHM<T>, fn: (v: any, k?: string) => T): T[] {
    if (!olhm) return [];
    if (!check(olhm, Object)) {
        throw new Error('OLHM expects an object as input')
    }
    const keys = Object.keys(olhm);
    if (keys.length === 0) {
        return [];
    }
    // single key optimization
    if (keys.length === 1) {
        return [fn(safeOLHV(<any>olhm[keys[0]]), keys[0])];
    }
    // 2 or more keys, scan for dependencies
    const graph = new Graph();
    for (const k of keys) {
        graph.addNode(k);
    }
    for (const k of keys) {
        if (isOLHV(olhm[k])) {
            graph.addDependency(k, olhm[k].require);
        }
    }
    // order based on dependencies
    const final: T[] = [];
    for (const k of graph.overallOrder()) {
        const res = fn(safeOLHV(olhm[k]), k);
        final.push(res)
    }
    return final;
}

export function reduce<T>(olhm: OLHM<T>, fn: (memo: any, value: any, index: number) => any, iv: any): T[] {
    const iterable = safeOLHM(olhm);
    let i = 0;
    for (const v of iterable) {
        iv = fn(iv, v, i);
        i++;
    }
    return iv;
}

export function isOLHV(obj: any): boolean {
    if (check(obj, Object)) {
        const keys = Object.keys(obj);
        return keys.length === 2 && containsAll(keys, ['require', 'value']);
    }
    return false;
}

export function safeOLHV<T>(objOrVal: OLHV<T> | T): T {
    if (isOLHV(objOrVal)) {
        return (<OLHV<T>>objOrVal).value;
    }
    return <T>objOrVal;
}