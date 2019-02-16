import { check } from './check';
import { isEqual, intersect, clean, each, map, every, extend, extendOwn, existentialExtend, replace, any, contains, containsAny, containsAll, combine, prune, plain, clone, arrayify, union, concat, difference } from './containers';

export function setValueForKeyPath(value: any, keyPath: string, input: SIO): void {
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
                } else if (!Array.isArray(current[thisKey])) {
                    current[thisKey] = [];
                }
            } else if (Array.isArray(current)) {
                if (!(current[parseInt(thisKey, 10)] !== null &&
                    typeof current[parseInt(thisKey, 10)] === 'object')) {
                    current[parseInt(thisKey, 10)] = {};
                }
            } else if (!(current[thisKey] !== null &&
                typeof current[thisKey] === 'object')) {
                current[thisKey] = {};
            }
        }
        if (Array.isArray(current)) {
            current = current[parseInt(thisKey, 10)];
        } else {
            current = current[thisKey];
        }
    }
    const lastKey = keys[keys.length - 1];
    if (Array.isArray(current)) {
        current[parseInt(lastKey, 10)] = value;
    } else if (current !== null && typeof current === 'object') {
        current[lastKey] = value;
    }
}

export function mergeValueAtKeypath(value: any, keyPath: string, obj: SIO): void {
    // this function mutates obj
    const existing = valueForKeyPath(keyPath, obj);
    if (check(value, Object) && check(existing, Object)) {
        extend(existing, value);
    } else if (check(value, Array) && check(existing, Array)) {
        setValueForKeyPath(union(existing, value), keyPath, obj);
    } else {
        setValueForKeyPath(value, keyPath, obj);
    }
}

export function valueForKeyPath(keyPath: string, input: SIO): any {
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
        } else if (current !== null && typeof current === 'object') {
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
    return current[lastKey];
}

export function unsetKeyPath(keyPath: string, obj: SIO): boolean {
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
        } else if (current !== null && typeof current === 'object') {
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

export function _keyPathContainsPath(keyPath: string, ignorePath: string): boolean {
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

export function keyPathContainsPath(keyPath: string, ignorePath: string): boolean {
    if (keyPath === ignorePath) {
        return true;
    }
    return _keyPathContainsPath(keyPath, ignorePath);
}

export const lastKey = (kp: string) => {
    const parts = kp.split('.');
    if (parts.length) {
        return parts[parts.length - 1];
    }
    return kp;
}

export function filteredKeyPaths(_keyPaths: string[], ignore?: string[]): string[] {
    if (!ignore.length) {
        return _keyPaths;
    }
    const toFilter: string[] = [];
    for (const ignorePath of ignore) {
        for (const keyPath of _keyPaths) {
            if (keyPathContainsPath(keyPath, ignorePath)) {
                toFilter.push(keyPath);
            }
        }
    }
    return difference(_keyPaths, toFilter);
}


export function keyPaths(obj: SIO, _options?: TJT.Keypath.Options, _stack?: string[], parent?: string): string[] {
    const stack = _stack || [];
    const options = <TJT.Keypath.Options>clone(_options || {});
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
                        } else {
                            stack.push(p);
                        }
                    }
                } else {
                    stack.push(parent ? `${parent}.${el}` : el);
                }
            } else if (val instanceof Date) {
                const key = parent ? `${parent}.${el}` : el;
                stack.push(key);
            } else if (val !== null && typeof val === 'object') {
                if (val instanceof Buffer || val instanceof RegExp) {
                    stack.push(parent ? `${parent}.${el}` : el);
                } else {
                    if (options.allLevels) {
                        stack.push(parent ? `${parent}.${el}` : el);
                    }
                    keyPaths(val, options, stack, parent ? `${parent}.${el}` : el);
                }
            } else {
                stack.push(parent ? `${parent}.${el}` : el);
            }
        }
    } else {
        stack.push(parent ? `${parent}` : '');
    }

    return stack;
}

export function allKeyPaths(obj: SIO, options?: TJT.Keypath.Options): string[] {
    return keyPaths(obj, { allLevels: true, diffArrays: true, ...options });
}

export function flatObject(object: any, options?: { includeBranches?: boolean }): SIO {
    const flat = <SIO>{};
    const kpFunc = (options || {}).includeBranches ? allKeyPaths : keyPaths;
    for (const keyPath of kpFunc(object)) {
        flat[keyPath] = valueForKeyPath(keyPath, object);
    }
    return flat;
}

export const unflatten = (source: any) => {
    const ret: any = {};
    each(source, (val: any, keyPath: string) => {
        if (check(val, Number) || val) {
            setValueForKeyPath(val, keyPath, ret);
        }
    });
    return ret;
}