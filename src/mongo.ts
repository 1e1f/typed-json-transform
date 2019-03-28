import { check, isEqual } from './check';
import { contains } from './arrays';
import { each, prune, clone } from './containers';

import {
  valueForKeyPath, _keyPathContainsPath,
  setValueForKeyPath, mergeValueAtKeypath, unsetKeyPath, keyPaths,
  allKeyPaths, filteredKeyPaths
} from './keypath';

interface Modifier {
  $set?: any
  $unset?: any
}

function shouldSet(val: any, prev: any): boolean | void {
  if (Array.isArray(val)) {
    return !isEqual(prev, val);
  } else if (val instanceof Date) {
    if (prev instanceof Date) {
      return (val.getTime() !== prev.getTime());
    }
    return !!val.getTime();
  } else if (check(val, Number)) {
    return (prev !== val) || !check(prev, Number);
  } else if (val !== null && typeof val === 'object') {
    return !isEqual(prev, val);
  } else if (val) {
    return prev !== val;
  }
}

function shouldUnset(val: any, prev: any): boolean {
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

function diffToModifier(prev: TJT.SIO, doc: TJT.SIO, fieldsToIgnore?: string[], pruneEmptyObjects?: boolean): Modifier {
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
      const newDelta = diffToModifier(prev, apply(clone(prev), delta), fieldsToIgnore, false);
      return newDelta || delta;
    }
    return delta;
  }
}

function modifierToObj(modifier: Modifier): TJT.SIO {
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

function objToModifier(obj: TJT.SIO): Modifier {
  return diffToModifier(null, obj);
}

function apply<T>(dest: T, source: Modifier): T {
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
  return prune(dest);
}

function $set(dest: TJT.SIO, source?: Modifier): void {
  if (!source) {
    return;
  }
  if (source.$set || source.$unset) {
    $set(dest, source.$set);
  }
  return each(<any>source, (val: any, keyPath: string) => {
    if (check(val, Number) || val) {
      setValueForKeyPath(val, keyPath, dest);
    }
  });
}

function $addToSet<T>(dest: T[], src: T): T[] {
  if (!Array.isArray(dest)) {
    throw new Error('$addToSet, 1st arg not array');
  }
  if (!contains(dest, src)) {
    dest.push(src);
  }
  return dest;
}

function $unset(dest: Object, source?: Modifier): void {
  if (!source) {
    return;
  }
  if (source.$unset || source.$set) {
    $unset(dest, source.$unset);
  }
  each(<any>source, (val: any, keyPath: string) => { unsetKeyPath(keyPath, dest); });
}

function update(doc: any, options: any): Modifier {
  let model: any;
  if (check(options.get, Function)) {
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
    if (check(options.set, Function)) {
      const copy = clone(model);
      apply(copy, diff);
      options.set(copy);
      if (!isEqual(copy, model)) {
        throw new Error('Diff: not equal after update');
      }
    } else if (options.collection) {
      options.collection.update({ _id: model._id }, { $set: diff });
    }
  }
  return diff;
}


function mapModifierToKey(modifier: Modifier, key: string): Modifier {
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

export {
  diffToModifier, modifierToObj, objToModifier, $set, $addToSet, $unset, update,
  apply, mapModifierToKey
};
