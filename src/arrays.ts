
import { check, isEqual } from './check';

export const compareAndFilter = (arr1: any[], arr2: any[], fn: (a: any, b: any) => any, filter?: boolean) => {
    const ret = [];
    for (let i = 0; i < arr1.length; i++) {
        const a = arr1[i];
        const b = arr2[i];
        const v = fn(a, b);
        if (v || (check(v, Number))) ret.push(v);
    }
    return ret;
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

export const all = every;

export namespace Mutate {
    export function concat<T>(...args: T[][]): void {
        const [input, ...rest] = args;
        for (const arr of rest) {
            for (const v of arr) {
                input.push(v);
            }
        }
    }

    export function assign<T>(a: T[], b: T[]): void {
        a.length = 0;
        concat(a, b);
    }


    export function deduplicate<T>(input: T[]): void {
        const res: T[] = [];
        for (const v of input) {
            if (!contains(res, v)) {
                res.push(v);
            }
        }
        assign(input, res);
    }

    export function union<T>(...args: T[][]): void {
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

    export function intersect<T>(...args: T[][]): void {
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
        assign(args[0], res);
    }

    export function difference<T>(a: T[], b: T[]): void {
        const res = <T[]>[];
        for (const v of b) {
            if (!contains(a, v)) {
                res.push(v);
            }
        }
        assign(a, res);
    }

    export function subtract<T>(a: T[], b: T[]): void {
        const res = <T[]>[];
        for (const v of a) {
            if (!contains(b, v)) {
                res.push(v);
            }
        }
        assign(a, res);
    }

    export function xor<T>(a: T[], b: T[]): void {
        const res = <T[]>[];
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

    export const compareAndFilter = (arr1: any[], arr2: any[], fn: (a: any, b: any) => any, filter?: boolean) => {
        const ret = [];
        for (let i = 0; i < arr1.length; i++) {
            const a = arr1[i];
            const b = arr2[i];
            const v = fn(a, b);
            if (v || (check(v, Number))) ret.push(v);
        }
        assign(arr1, ret);
    }

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

export function arrayify<T>(val: T | T[]): T[] {
    if (check(val, Array)) {
        return val as T[];
    }
    return [val as T];
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
