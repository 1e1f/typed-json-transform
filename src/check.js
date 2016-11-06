import _ from 'lodash';

function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

function _c(val, type) {
  switch (type) {
    case String:
    case 'String':
      return typeof val === 'string' && !isNumeric(val);
    case Number:
    case 'Number':
      return isNumeric(val);
    case Date:
    case 'Date':
      return val !== undefined && val instanceof Date;
    case Array:
    case 'Array':
      return Array.isArray(val);
    case Function:
    case 'Function':
      return _.isFunction(val);
    case Object:
    case 'Object':
      return val !== null && typeof val === 'object' && !_c(val, Date) && !_c(val, Array) && !_c(val, Error);
    case 'Boolean':
      return typeof val === 'boolean';
    case Error:
    case 'Error':
      return val instanceof Error;
    case undefined:
    case 'Undefined':
      return val === undefined;
    case 'any':
      return val !== undefined || isNumeric(val);
    default:
      throw new Error(`checking unsupported type ${type}`);
  }
}

function check(val, type) {
  if (_c(type, 'Array')) {
    return _.any(type, (sType) => {
      return _c(val, sType);
    });
  }
  return _c(val, type);
}

export default check;
