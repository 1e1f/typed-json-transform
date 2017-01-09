import check from './check';
import { arrayify, containsAll } from './containers';
import { NodeGraph } from './graph';

class OLHV<T> {
    require?: string;
    value: T
}

class OLHM<T> {
    [index: string]: OLHV<T>;
}

function parseOLHM(object: any): OLHM<any> {
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

function safeOLHM<T>(olhm: OLHM<T>): T[] {
    if (!olhm) return [];
    if (!check(olhm, Object)) {
        return arrayify(olhm);
    }
    const keys = Object.keys(olhm);
    if (keys.length === 0) {
        return [];
    }
    // single key optimization
    if (keys.length === 1) {
        return [safeOLHV(<any>olhm)];
    }
    // 2 or more keys, scan for dependencies
    const graph = new NodeGraph();
    for (const k of keys) {
        graph.addNode(k);
    }
    for (const k of keys) {
        if (olhm[k] && olhm[k].require) {
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

function isOLHV(obj: any): boolean {
    if (check(obj, Object)) {
        const keys = Object.keys(obj);
        return keys.length === 2 && containsAll(keys, ['require', 'value']);
    }
    return false;
}

function safeOLHV<T>(objOrVal: OLHV<T> | T): T {
    if (isOLHV(objOrVal)) {
        return (<OLHV<T>>objOrVal).value;
    }
    return <T>objOrVal;
}

export {
    isOLHV, safeOLHM, safeOLHV, parseOLHM
}