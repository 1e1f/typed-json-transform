export function isNumeric(n: any) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

function _c(val: any, type: any): boolean {
  switch (type) {
    case Array:
    case 'Array':
      return Array.isArray(val);
    case Date:
    case 'Date':
      return val !== undefined && val instanceof Date;
    case Object:
    case 'Object':
      return val !== null && typeof val === 'object' && !_c(val, Date) && !_c(val, Array) && !_c(val, Error);
    case String:
    case 'String':
      return typeof val === 'string' && !isNumeric(val);
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
      return val !== undefined && val.constructor === type;
  }
}

export function check(val: any, type: any) {
  if (_c(type, Array)) {
    for (const sType of type) {
      if (_c(val, sType)) {
        return true;
      }
    }
    return false;
  }
  return _c(val, type);
}