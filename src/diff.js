import jc from 'json-cycle';
import _ from 'lodash';
import check from './check';

function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

function _prune(el) {
  for (const key in el) {
    const val = el[key];
    if (Array.isArray(val)) {
      if (val.length && !isEmpty(val)) {
        if (_prune(val)) {
          delete el[key];
        }
      } else {
        delete el[key];
      }
    } else if (val instanceof Date) {} else if (val !== null && typeof val === 'object') {
      if (Object.keys(val).length && !isEmpty(val)) {
        if (_prune(val)) {
          delete el[key];
        }
      } else {
        delete el[key];
      }
    }
  }
  return isEmpty(el);
}

function prune(obj) {
  _prune(obj);
  return obj;
}

function isEmpty(el) {
  let containsValid = 0;
  for (const i in el) {
    if (el[i] || isNumeric(el[i])) {
      containsValid = true;
    }
  }
  return !containsValid;
}

function setValueForKeyPath(value, keyPath, current) {
  const keys = keyPath.split('.');
  for (const i of keys) {
    if (keys[i]) {
      const thisKey = keys[i];
      if (keys.length > i) {
        const nextKey = keys[i + 1];
        if (check(nextKey, Number)) {
          if (Array.isArray(current)) {
            if (!Array.isArray(current[parseInt(thisKey, 10)])) {
              current[parseInt(thisKey, 10)] = [];
            }
          } else if (!Array.isArray(current[thisKey])) {
            current[thisKey] = [];
          }
        } else if (Array.isArray(current)) {
          if (current[parseInt(thisKey, 10)] === null || typeof current[parseInt(thisKey, 10)] !== 'object') {
            current[parseInt(thisKey, 10)] = {};
          }
        } else if (current[thisKey] === null || typeof current[thisKey] !== 'object') {
          current[thisKey] = {};
        }
      }
      if (Array.isArray(current)) {
        current = current[parseInt(thisKey, 10)];
      } else {
        current = current[thisKey];
      }
      const lastKey = keys[keys.length - 1];
      if (Array.isArray(current)) {
        current[parseInt(lastKey, 10)] = value;
      } else {
        current[lastKey] = value;
      }
    }
  }
}

function mergeValueAtKeypath(value, keyPath, current) {
  const existing = valueForKeyPath(keyPath, current);
  let merged = value;
  if (check(value, Object) && check(existing, Object)) {
    merged = _.extend(existing, value);
  }
  return setValueForKeyPath(merged, keyPath, current);
}

function valueForKeyPath(keyPath, current) {
  if (!current) {
    return undefined;
  }
  const keys = keyPath.split('.');
  for (let i = 0; i < keys.length; i += 1) {
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

function unsetKeyPath(keyPath, obj) {
  const keys = keyPath.split('.');
  let current = obj;
  let i = 0;
  while (i < keys.length - 1) {
    const key = keys[i];
    if (Array.isArray(current)) {
      if (!current[parseInt(key)]) {
        return 0;
      }
      current = current[parseInt(key)];
    } else if (current !== null && typeof current === 'object') {
      if (!current[key]) {
        return 0;
      }
      current = current[key];
    }
    i++;
  }
  const lastKey = keys[keys.length - 1];
  if (Array.isArray(current)) {
    const index = parseInt(lastKey);
    if (current[index] !== void 0) {
      delete current[index];
      return 1;
    }
    return 0;
  } else {
    if (current[lastKey] !== void 0) {
      delete current[lastKey];
      return 1;
    }
    return 0;
  }
}

function _keyPathContainsPath(keyPath, ignorePath) {
  const p = keyPath.split('.');
  const t = ignorePath.split('.');
  if (!(p.length > t.length)) {
    return false;
  }
  for (let i = 0; i < t.length; i++) {
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

function trimUnsetter(modifier) {
  const keys = Object.keys(modifier);
  for (const one in keys) {
    for (const two in keys) {
      if (_keyPathContainsPath(keys[one], keys[two])) {
        delete modifier[keys[one]];
      }
    }
  }
  return modifier;
}

function filteredKeyPaths(keyPaths, ignore) {
  const toFilter = [];
  for (const ig in ignore) {
    const ignorePath = ignore[ig];
    for (const i in keyPaths) {
      const keyPath = keyPaths[i];
      if (keyPathContainsPath(keyPath, ignorePath)) {
        toFilter.push(keyPath);
      }
    }
  }
  return _.difference(keyPaths, toFilter);
}

function keyPaths(obj, _options, _stack, parent) {
  const stack = _stack || [];
  const options = _options || {};
  for (const el of Object.keys(obj)) {
    if (obj.hasOwnProperty.call(el)) {
      if (Array.isArray(obj[el])) {
        if (options.allLevels) {
          stack.push(parent
            ? `${parent}.${el}`
            : el);
        }
        if (options.diffArrays) {
          for (let i = 0; i < obj[el].length; i += 1) {
            let p;
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
          stack.push(parent
            ? `${parent}.${el}`
            : el);
        }
      } else if (obj[el]instanceof Date) {
        const key = parent
          ? `${parent}.${el}`
          : el;
        stack.push(key);
      } else if (obj[el] !== null && typeof obj[el] === 'object') {
        if (options.allLevels) {
          stack.push(parent
            ? `${parent}.${el}`
            : el);
        }
        keyPaths(obj[el], options, stack, parent
          ? `${parent}.${el}`
          : el);
      } else {
        stack.push(parent
          ? `${parent}.${el}`
          : el);
      }
    }
  }
  return stack;
}

function allKeyPaths(obj) {
  return keyPaths(obj, {allLevels: true});
}

function forwardDiffToModifier(prev, doc, fieldsToIgnore) {
  const filteredKeys = _.union(_.difference(keyPaths(prev), keyPaths(doc)), fieldsToIgnore || []);
  return diffToModifier(prev, doc, filteredKeys);
}

function shouldSet(val, prev) {
  if (Array.isArray(val)) {
    return !_.isEqual(prev, val);
  } else if (val instanceof Date) {
    return !(prev instanceof Date) || (val.getTime() !== prev.getTime());
  } else if (isNumeric(val)) {
    return (prev !== val) || !isNumeric(prev);
  } else if (val !== null && typeof val === 'object') {
    return Object
      .keys(val)
      .length && !_.isEqual(prev, val);
  } else if (val) {
    return prev !== val;
  }
}

function shouldUnset(val, prev) {
  if ((prev || isNumeric(prev)) && !(val || isNumeric(val))) {
    return true;
  }
  if (val !== null && typeof curVal === 'object') {
    if (!Object.keys(val).length) {
      return true;
    }
  }
  return false;
}

function diffToModifier(prev, doc, fieldsToIgnore, pruneEmptyObjects) {
  const delta = {
    $set: {},
    $unset: {}
  };
  if (doc) {
    const forwardKeyPaths = filteredKeyPaths(keyPaths(doc), fieldsToIgnore);
    for (const k in forwardKeyPaths) {
      const keyPath = forwardKeyPaths[k];
      const val = valueForKeyPath(keyPath, doc);
      if (shouldSet(val, valueForKeyPath(keyPath, prev))) {
        delta.$set[keyPath] = val;
      }
    }
  }
  if (prev) {
    const existingKeyPaths = filteredKeyPaths(keyPaths(prev, {allLevels: true}), fieldsToIgnore);
    for (const k in existingKeyPaths) {
      const keyPath = existingKeyPaths[k];
      const curVal = valueForKeyPath(keyPath, doc);
      if (shouldUnset(curVal, valueForKeyPath(keyPath, prev))) {
        delta.$unset[keyPath] = true;
      }
    }
    trimUnsetter(delta.$unset);
  }
  if (!Object.keys(delta.$set).length) {
    delete delta.$set;
  }
  if (!Object.keys(delta.$unset).length) {
    delete delta.$unset;
  }
  if (Object.keys(delta).length) {
    if (pruneEmptyObjects) {
      const newDelta = diffToModifier(prev, (_.clone(prev), delta), fieldsToIgnore, false);
      return newDelta || delta;
    }
    return delta;
  }
  return false;
}

function flatObject(object) {
  const flat = {};
  _.each(allKeyPaths(object), (keyPath) => {
    flat[keyPath] = valueForKeyPath(keyPath, object);
  });
  return flat;
}

function flatterObject(object) {
  const flat = {};
  _.each(keyPaths(object), (keyPath) => {
    flat[keyPath] = valueForKeyPath(keyPath, object);
  });
  return flat;
}

function modifierToObj(modifier) {
  if (modifier) {
    const obj = {};
    _.each(modifier.$set, (val, keyPath) => {
      return setValueForKeyPath(val, keyPath, obj);
    });
    _.each(modifier.$unset, (val, keyPath) => {
      return setValueForKeyPath('', keyPath, obj);
    });
    return obj;
  }
}

function objToModifier(obj) {
  return diffToModifier(undefined, obj);
}

function apply(dest, source) {
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

function $set(dest, source) {
  if (!source) {
    return;
  }
  if (source.$set || source.$unset) {
    return $set(dest, source.$set);
  }
  return _.each(source, (val, keyPath) => {
    if (isNumeric(val) || val) {
      return setValueForKeyPath(val, keyPath, dest);
    }
  });
}

function $addToSet(dest, src) {
  if (!Array.isArray(dest)) {
    throw new Error('$addToSet, 1st arg not array');
  }
  if (!_.contains(dest, src)) {
    dest.push(src);
  }
  return dest;
}

function $unset(dest, source) {
  if (!source) {
    return;
  }
  if (source.$unset || source.$set) {
    return $unset(dest, source.$unset);
  }
  return _.each(source, (val, keyPath) => {
    return unsetKeyPath(keyPath, dest);
  });
}

function update(doc, options) {
  let model;
  if (_.isFunction(options.get)) {
    model = options.get();
  } else if (doc.id && options.collection) {
    model = options
      .collection
      .findOne({_id: doc.id});
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
      const copy = _.clone(model);
      apply(copy, diff);
      options.set(clone);
      if (!_.isEqual(clone, model)) {
        throw new Error('Diff: not equal after update');
      }
    } else if (options.collection) {
      options
        .collection
        .update({
          _id: model._id
        }, {$set: diff});
    }
  }
  return diff;
}

function clone(obj) {
  let copy;
  if (obj === null || typeof obj !== 'object') {
    return obj;
  } else if (obj instanceof Date) {
    copy = new Date();
    copy.setTime(obj.getTime());
    return copy;
  } else if (obj instanceof Array) {
    copy = [];
    for (let i = 0; i < obj.length; i += 1) {
      copy[i] = clone(obj[i]);
    }
    return copy;
  } else if (obj instanceof Object) {
    copy = {};
    for (const attr in obj) {
      if (obj.hasOwnProperty.call(attr)) {
        copy[attr] = clone(obj[attr]);
      }
    }
    return copy;
  }
  throw new Error('Unable to copy obj! Its type isn\'t supported.');
}

function mapModifierToKey(modifier, key) {
  const valueModifier = {};
  for (const keyPath in modifier.$set) {
    if (valueModifier.$set == null) {
      valueModifier.$set = {};
    }
    valueModifier.$set[key + '.' + keyPath] = modifier.$set[keyPath];
  }
  for (const keyPath in modifier.$unset) {
    if (valueModifier.$unset == null) {
      valueModifier.$unset = {};
    }
    valueModifier.$unset[`${key}.${keyPath}`] = modifier.$set[keyPath];
  }
  return valueModifier;
}

function stringify(json, rep, ind) {
  return JSON.stringify(jc.decycle(json), rep, ind || 2);
}

export {
  diffToModifier,
  forwardDiffToModifier,
  valueForKeyPath,
  keyPathContainsPath,
  setValueForKeyPath,
  unsetKeyPath,
  keyPaths,
  allKeyPaths,
  filteredKeyPaths,
  modifierToObj,
  objToModifier,
  flatObject,
  flatterObject,
  isNumeric,
  prune,
  clone,
  $set,
  $addToSet,
  $unset,
  update,
  apply,
  stringify,
  mapModifierToKey
};
