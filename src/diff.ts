import * as _ from 'lodash';

import jc = require('json-cycle');
import check from './check';

interface StringIndexableObject { [index: string]: any }

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

function mergeValueAtKeypath(value: string, keyPath: string,
  obj: StringIndexableObject) {
  // this function mutates obj
  const existing = valueForKeyPath(keyPath, obj);
  let merged = value;
  if (check(value, Object) && check(existing, Object)) {
    merged = _.extend(existing, value);
  }
  return setValueForKeyPath(merged, keyPath, obj);
}

function extend(target: StringIndexableObject, source: StringIndexableObject) {
  if (!source){
    return target;
  }
  for (const key of Object.keys(source)) {
    if (check(source[key], Object) && check(target[key], Object)) {
      extend(target[key], source[key]);
    } else {
      target[key] = clone(source[key]);
    }
  }
  return target;
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
  return _.difference(_keyPaths, toFilter);
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
    if (obj[el]) {
      if (Array.isArray(obj[el])) {
        if (options.allLevels) {
          stack.push(parent ? `${parent}.${el}` : el);
        }
        if (options.diffArrays) {
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
  }
  return stack;
}

function allKeyPaths(obj: StringIndexableObject) {
  return keyPaths(obj, { allLevels: true });
}

function forwardDiffToModifier(prev: StringIndexableObject,
  doc: StringIndexableObject,
  fieldsToIgnore?: string[]) {
  const filteredKeys = _.union
    (_.difference(keyPaths(prev), keyPaths(doc)), fieldsToIgnore || []);
  return diffToModifier(prev, doc, filteredKeys);
}

function shouldSet(val: any, prev: any) {
  if (Array.isArray(val)) {
    return !_.isEqual(prev, val);
  } else if (val instanceof Date) {
    return !(prev instanceof Date) || (val.getTime() !== prev.getTime());
  } else if (check(val, Number)) {
    return (prev !== val) || !check(prev, Number);
  } else if (val !== null && typeof val === 'object') {
    return Object.keys(val).length && !_.isEqual(prev, val);
  } else if (val) {
    return prev !== val;
  }
}

function shouldUnset(val: any, prev: any) {
  if ((prev || check(prev, Number)) && !(val || check(val, Number))) {
    return true;
  }
  if (val !== null && typeof prev === 'object') {
    if (!Object.keys(val).length) {
      return true;
    }
  }
  return false;
}

interface Modifier {
  $set?: StringIndexableObject;
  $unset?: StringIndexableObject;
}

function diffToModifier(prev: StringIndexableObject, doc: StringIndexableObject,
  fieldsToIgnore?: string[],
  pruneEmptyObjects?: boolean): Modifier {
  const delta: Modifier = { $set: {}, $unset: {} };
  if (doc) {
    const forwardKeyPaths =
      filteredKeyPaths(keyPaths(doc), fieldsToIgnore || []);
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
      const newDelta =
        diffToModifier(prev, (clone(prev), delta), fieldsToIgnore, false);
      return newDelta || delta;
    }
    return delta;
  }
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

function groupReduce<T>(objOrArray: any, groupField: string,
  reduceFunction: Function, baseType?: T) {
  if (!(Array.isArray(objOrArray) ||
    (objOrArray !== null && typeof objOrArray === 'object'))) {
    throw new Error('not reducing array or object');
  }
  const root: StringIndexableObject = {};
  _.each(objOrArray, (value) => {
    const key = value[groupField];
    root[key] = reduceFunction(root[key] || baseType || {}, value, key);
  });
  return root;
}

function okmap(iterable: Object | Array<any>, fn: Function) {
  const sum: StringIndexableObject = {};
  _.each(iterable, (v, k) => {
    const res = fn(v, k);
    const key = Object.keys(res)[0];
    sum[key] = res[key];
  });
  return sum;
}

function modifierToObj(modifier: Modifier) {
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

function objToModifier(obj: StringIndexableObject) {
  return diffToModifier(undefined, obj);
}

function apply(dest: StringIndexableObject, source: Modifier) {
  if (!source) {
    return dest;
  }
  if (source.$set || source.$unset) {
    $set(dest, source);
    $unset(dest, source);
  } else {
    const mod = objToModifier(source);
    $set(dest, mod);
    $unset(dest, mod);
  }
  _prune(dest);
  return dest;
}

function $set(dest: StringIndexableObject, source: Modifier) {
  if (!source) {
    return;
  }
  if (source.$set || source.$unset) {
    $set(dest, source.$set);
  }
  return _.each(source, (val, keyPath) => {
    if (check(val, Number) || val) {
      setValueForKeyPath(val, keyPath, dest);
    }
  });
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

function every(iterable: Array<any>, fn: Function) {
  for (const v of iterable) {
    if (fn(v) === false) {
      return false;
    }
  }
  return true;
}

function contains<T>(set: Array<T>, match: T) {
  if (check(match, Array)) {
    return containsAny(set, match as any);
  }
  for (const val of set) {
    if (check(val, Object)) {
      if (_.isEqual(val, set)) {
        return true;
      }
    }
    else if (val === match) {
      return true;
    }
  }
  return false;
}

function containsAny<T>(set: Array<T>, match: Array<T>) {
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

function containsAll<T>(set: Array<T>, match: Array<T>) {
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

function $addToSet(dest: Array<any>, src: Object) {
  if (!Array.isArray(dest)) {
    throw new Error('$addToSet, 1st arg not array');
  }
  if (!contains(dest, src)) {
    dest.push(src);
  }
  return dest;
}

function $unset(dest: Object, source: Modifier) {
  if (!source) {
    return;
  }
  if (source.$unset || source.$set) {
    $unset(dest, source.$unset);
  }
  _.each(source, (val, keyPath) => { unsetKeyPath(keyPath, dest); });
}

interface Document extends StringIndexableObject {
  _id: string;
}

interface Collection {
  findOne: Function;
  find: Function;
  update: Function;
}

interface UpdateOptions {
  collection?: Collection;
  get?: Function;
  set?: Function;
  ignore?: string[];
}

function update(doc: Document, options: UpdateOptions) {
  let model: Document;
  if (_.isFunction(options.get)) {
    model = options.get();
  } else if (doc._id && options.collection) {
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
    if (_.isFunction(options.set)) {
      const copy = clone(model);
      apply(copy, diff);
      options.set(copy);
      if (!_.isEqual(copy, model)) {
        throw new Error('Diff: not equal after update');
      }
    } else if (options.collection) {
      options.collection.update({ _id: model._id }, { $set: diff });
    }
  }
  return diff;
}

function clone<T>(input: T): T {
  if (input === undefined) {
    throw new Error('can\'t clone undefined');
  } else if (input === null) {
    throw new Error('can\'t clone null');
  } else if (input instanceof Date) {
    const newDate = new Date(<number>input.valueOf());
    return <T><any>newDate;
  } else if (input instanceof Array) {
    const array: Array<any> = [];
    for (let i = 0; i < input.length; i += 1) {
      array[i] = clone(input[i]);
    }
    return <T><any>array;
  } else if (typeof input === 'object') {
    const iObj = input as StringIndexableObject;
    const newObj: StringIndexableObject = {};
    for (const key of Object.keys(iObj)) {
      if(iObj[key]){
        newObj[key] = clone(iObj[key]);
      }
    }
    return <T><any>newObj;
  } else if (typeof input === 'string') {
    return input;
  } else if (typeof input === 'number') {
    return input;
  } else if (typeof input === 'boolean') {
    return input;
  }
  throw new Error(
    `diff.clone is unable to copy input ${JSON.stringify(input)}`);
}

function mapModifierToKey(modifier: Modifier, key: string) {
  if (!modifier) {
    throw new Error('called mapModifierToKey on undefined');
  }
  const valueModifier: Modifier = {};
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

function stringify(value: any, replacer?: (number | string)[],
  space?: string | number): string {
  return JSON.stringify(jc.decycle(value), replacer, space || 2);
}

function plain(obj: any) {
  return JSON.parse(JSON.stringify(obj));
}

function arrayify(val: any) {
  if (check(val, Array)) {
    return val;
  }
  return [val];
}

export default {
  diffToModifier, forwardDiffToModifier, valueForKeyPath, keyPathContainsPath,
  setValueForKeyPath, mergeValueAtKeypath, unsetKeyPath, keyPaths,
  allKeyPaths, filteredKeyPaths, modifierToObj, objToModifier, flatObject,
  any, every, contains, containsAny, containsAll, prune, plain, clone,
  extend, combine, groupReduce, okmap, $set, $addToSet, $unset, update,
  apply, mapModifierToKey, stringify, arrayify
};
