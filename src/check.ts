import { TJT } from './types';

export const objectToString = (value) => {
  if (!value) {
    return value === undefined ? '[object Undefined]' : '[object Null]'
  }
  return Object.prototype.toString.call(value)
}

export const isArrayBuffer = (val) =>
  val !== null && typeof val === 'object' && objectToString(val) == '[object ArrayBuffer]'

export function check(val: any, type: any) {
  if (_c(type, Array)) {
    for (const sType of type) {
      if (_c(val, sType)) {
        return true;
      }
    }
    return false;
  }
  // if (type && type.prototype) { console.log(new Error().stack); return val && val.prototype == type.prototype; }
  return _c(val, type);
}

export const MapLike = 'MapLike';

function _c(val: any, type: any): boolean {
  switch (type) {
    case ArrayBuffer:
    case 'ArrayBuffer':
      return isArrayBuffer(val);
    case Array:
    case 'Array':
      return Array.isArray(val);
    case Date:
    case 'Date':
      return val !== undefined && val instanceof Date;
    case MapLike:
    case 'MapLike':
      return (val instanceof Map) || _c(val, Object);
    case Map:
    case 'Map':
      return val instanceof Map;
    case Object:
    case 'Object':
      return val !== null && typeof val === 'object' && !_c(val, Date) && !_c(val, Array) && !_c(val, Error);
    case String:
    case 'String':
      return typeof val === 'string';
    case Number:
    case 'Number':
      return isNumeric(val);
    case Function:
    case 'Function':
      return (val !== null && typeof val === 'function');
    case Boolean:
    case 'Boolean':
      return typeof val === 'boolean';
    case Number:
    case 'Number':
      return isNumeric(val);
    case 'undefined':
    case undefined:
    case 'Undefined':
      return val === undefined;
    case null:
      return val === null;
    case Error:
    case 'Error':
      return val instanceof Error;
    case 'any':
      return (val !== null && val !== undefined) || isNumeric(val);
    default:
      return val !== undefined && (val.constructor === type || val.prototype == type.prototype);
  }
}

export const isNumeric = (n: any) => !isNaN(parseFloat(n)) && isFinite(n);
export const isArguments = (object: any) => Object.prototype.toString.call(object) == '[object Arguments]';

export function isEmpty(input: { [index: string]: string }): boolean {
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

export const isUndefinedOrNull = (value: any) => value === null || value === undefined;

export function isBuffer(x: any): boolean {
  if (!x || typeof x !== 'object' || typeof x.length !== 'number') return false;
  if (typeof x.copy !== 'function' || typeof x.slice !== 'function') {
    return false;
  }
  if (x.length > 0 && typeof x[0] !== 'number') return false;
  return true;
}


export function isEqual(a: any, e: any, opts?: TJT.ComparisonOptions): boolean {
  // http://wiki.commonjs.org/wiki/Unit_Testing/1.0
  if (!opts) opts = <TJT.ComparisonOptions>{};
  // 7.1. All identical values are equivalent, as determined by ===.
  if (a === e) {
    return true;
  }
  else if (a instanceof Date && e instanceof Date) {
    return a.getTime() === e.getTime();
    // 7.3. Other pairs that do not both pass typeof value == 'object',
    // equivalence is determined by ==.
  } else if (!a || !e || typeof a != 'object' && typeof e != 'object') {
    return opts.strict ? a === e : a == e;
    // 7.4. For all other Object pairs, including Array objects, equivalence is
    // determined by having the same number of owned properties (as verified
    // with Object.prototype.hasOwnProperty.call), the same set of keys
    // (although not necessarily the same order), equivalent values for every
    // corresponding key, and an identical 'prototype' property. Note: this
    // accounts for both named and indexed properties on Arrays.
  }
  return _objEquiv(a, e, opts);
}

const pSlice = Array.prototype.slice;

const compareBuffer = (a: Buffer, b: Buffer) => {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function _objEquiv(a: any, b: any, opts?: TJT.ComparisonOptions): boolean {
  if (isUndefinedOrNull(a) || isUndefinedOrNull(b)) return false;
  // an identical 'prototype' property.
  if (a.prototype !== b.prototype) return false;
  //~~~I've managed to break Object.keys through screwy arguments passing.
  //   Converting to array solves the problem.
  if (isArguments(a)) {
    if (!isArguments(b)) return false;
    a = pSlice.call(a);
    b = pSlice.call(b);
    return isEqual(a, b, opts);
  }
  if (isBuffer(a)) {
    if (!isBuffer(b)) return false;
    return compareBuffer(a, b);
  }
  let ka, kb;
  try {
    ka = Object.keys(a);
    kb = Object.keys(b);
  } catch (e) {//happens when one is a string literal and the other isn't
    return false;
  }
  // having the same number of owned properties (keys incorporates
  // hasOwnProperty)
  if (ka.length != kb.length) return false;
  //the same set of keys (although not necessarily the same order),
  ka.sort();
  kb.sort();
  //~~~cheap key test
  for (let i = ka.length - 1; i >= 0; i--) {
    if (ka[i] != kb[i]) return false;
  }
  //equivalent values for every corresponding key, and
  //~~~possibly expensive deep test
  for (let i = ka.length - 1; i >= 0; i--) {
    const key = ka[i];
    if (!isEqual(a[key], b[key], opts)) return false;
  }
  return typeof a === typeof b;
}
