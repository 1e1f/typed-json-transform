import check from './check';
import { isEqual, each, map, every, any, contains, containsAny, containsAll, extend, combine, prune, plain, clone, arrayify, union, difference } from './containers';

interface StringIndexableObject { [index: string]: any }

function setValueForKeyPath(value: string, keyPath: string,
    input: StringIndexableObject) {
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

function mergeValueAtKeypath(value: any, keyPath: string,
    obj: StringIndexableObject) {
    // this function mutates obj
    const existing = valueForKeyPath(keyPath, obj);
    let merged = value;
    if (check(value, Object) && check(existing, Object)) {
        extend(existing, value);
    }
    return setValueForKeyPath(merged, keyPath, obj);
}

function valueForKeyPath(keyPath: string, input: StringIndexableObject) {
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
                // throw new Error(`no value at array position ${key} while enumerating
                // valueForKeyPath`);
            }
            current = current[parseInt(key, 10)];
        } else if (current !== null && typeof current === 'object') {
            if (!current[key]) {
                return undefined;
                // throw new Error(`no key: ${key} in subobject while enumerating
                // valueForKeyPath`);
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

function unsetKeyPath(keyPath: string, obj: StringIndexableObject) {
    // this function mutates obj
    const keys = keyPath.split('.');
    let current = obj;
    for (let i = 0; i < keys.length - 1; i += 1) {
        const key = keys[i];
        if (Array.isArray(current)) {
            if (!current[parseInt(key, 10)]) {
                return 0;
            }
            current = current[parseInt(key, 10)];
        } else if (current !== null && typeof current === 'object') {
            if (!current[key]) {
                return 0;
            }
            current = current[key];
        }
    }
    const lastKey = keys[keys.length - 1];
    if (Array.isArray(current)) {
        const index = parseInt(lastKey, 10);
        if (current[index] !== undefined) {
            delete current[index];
            return 1;
        }
        return 0;
    }
    if (current[lastKey] !== undefined) {
        delete current[lastKey];
        return 1;
    }
    return 0;
}

function _keyPathContainsPath(keyPath: string, ignorePath: string) {
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

function keyPathContainsPath(keyPath: string, ignorePath: string) {
    if (keyPath === ignorePath) {
        return true;
    }
    return _keyPathContainsPath(keyPath, ignorePath);
}

function filteredKeyPaths(_keyPaths: string[], ignore?: string[]) {
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

interface keyPathOptions extends StringIndexableObject {
    allLevels?: boolean;
    diffArrays?: boolean;
}

function keyPaths(obj: StringIndexableObject, _options?: keyPathOptions,
    _stack?: string[], parent?: string) {
    const stack = _stack || [];
    const options = <keyPathOptions>clone(_options || {});
    for (const el of Object.keys(obj)) {
        if (Array.isArray(obj[el])) {
            if (options.diffArrays) {
                if (options.allLevels) {
                    stack.push(parent ? `${parent}.${el}` : el);
                }
                for (let i = 0; i < obj[el].length; i += 1) {
                    let p: string;
                    if (parent) {
                        p = `${parent}.${el}.${i}`;
                    } else {
                        p = `${el}.${i}`;
                    }
                    const s = obj[el][i];
                    if (Array.isArray(s) || (s !== null && typeof s === 'object')) {
                        keyPaths(s, options, stack, p);
                    } else {
                        stack.push(p);
                    }
                }
            } else {
                stack.push(parent ? `${parent}.${el}` : el);
            }
        } else if (obj[el] instanceof Date) {
            const key = parent ? `${parent}.${el}` : el;
            stack.push(key);
        } else if (obj[el] !== null && typeof obj[el] === 'object') {
            if (options.allLevels) {
                stack.push(parent ? `${parent}.${el}` : el);
            }
            keyPaths(obj[el], options, stack, parent ? `${parent}.${el}` : el);
        } else {
            stack.push(parent ? `${parent}.${el}` : el);
        }
    }
    return stack;
}

function allKeyPaths(obj: StringIndexableObject) {
    return keyPaths(obj, { allLevels: true });
}

interface FlatObjectOptions {
    includeBranches?: boolean;
}

function flatObject(object: StringIndexableObject,
    options?: FlatObjectOptions) {
    const flat: StringIndexableObject = {};
    const kpFunc = (options || {}).includeBranches ? allKeyPaths : keyPaths;
    for (const keyPath of kpFunc(object)) {
        flat[keyPath] = valueForKeyPath(keyPath, object);
    }
    return flat;
}

export {
    valueForKeyPath, _keyPathContainsPath, keyPathContainsPath,
    setValueForKeyPath, mergeValueAtKeypath, unsetKeyPath, keyPaths,
    allKeyPaths, filteredKeyPaths, flatObject
}