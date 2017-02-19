import { assert } from 'chai';
import { check } from '../src';

class CustomType {
  options: any;
  _data: any;
  data: any;
  constructor(_options = {
    isCustom: 'default'
  }, _data = [0, 'xyz']) {
    this.options = _options;
    this.data = _data;
  }
  memberFunction() {
    return this._data;
  }
}

const data = {
  object: {},
  objectArray: {
    0: 'value'
  },
  date: new Date(),
  array: <any>[],
  number: 1,
  null: <any>null,
  stringNumber: '1',
  complexStringNumber: '1.0.1',
  string: 'hello',
  error: new SyntaxError(),
  boolean: true,
  customObject: new CustomType({
    isCustom: 'not the default'
  }, ['someData']),
  undefined: <any>undefined,
  function: () => {
    return '';
  }
};

describe('check', () => {
  it('object', () => {
    assert.ok(check(data.object, Object), 'object is Object');
    assert.ok(!check(data.object, Array), 'object is not Array');
    assert.ok(!check(data.object, Function), 'object is not Function');
    assert.ok(!check(data.object, String), 'object is not String');
    assert.ok(!check(data.object, Number), 'object is not Number');
  });

  it('function', () => {
    assert.ok(check(data.function, Function), 'function is Function');
    assert.ok(!check(data.function, Object), 'function is Object');
    assert.ok(!check(data.function, Array), 'function is not Array');
    assert.ok(!check(data.function, String), 'function is not String');
    assert.ok(!check(data.function, Number), 'function is not Number');
  });

  it('array', () => {
    assert.ok(check(data.array, Array));
    assert.ok(!check(data.array, Object));
    assert.ok(!check(data.array, Function));
    assert.ok(!check(data.array, String));
    assert.ok(!check(data.array, Number));
    assert.ok(!check(data.objectArray, Array));
    assert.ok(check(data.objectArray, Object));
  });

  it('string', () => {
    assert.ok(!check(data.string, Object));
    assert.ok(!check(data.string, Array));
    assert.ok(check(data.string, String));
    assert.ok(!check(data.stringNumber, String));
    assert.ok(check(data.complexStringNumber, String));
    return assert.ok(!check(data.string, Number));
  });

  it('number', () => {
    assert.ok(!check(data.number, Object));
    assert.ok(!check(data.number, Array));
    assert.ok(!check(data.number, String));
    assert.ok(check(data.number, Number));
    assert.ok(check(data.stringNumber, Number));
    return assert.ok(!check(data.complexStringNumber, Number));
  });

  it('date', () => {
    assert.ok(check(data.date, Date));
    assert.ok(!check(data.date, Object));
    assert.ok(!check(data.date, Array));
    assert.ok(!check(data.date, String));
    assert.ok(!check(data.date, Object));
    assert.ok(!check(data.date, Number));
  });

  it('boolean', () => {
    assert.ok(check(data.boolean, Boolean));
    assert.ok(!check(data.boolean, Object));
    assert.ok(!check(data.boolean, Array));
    assert.ok(!check(data.boolean, String));
    assert.ok(!check(data.boolean, Object));
    assert.ok(!check(data.boolean, Number));
  });

  it('any', () => {
    assert.ok(check(data.string, 'any'));
    assert.ok(check(data.number, 'any'));
    assert.ok(check(data.object, 'any'));
    assert.ok(check(data.array, 'any'));
    assert.ok(check(data.function, 'any'));
    assert.ok(check(data.date, 'any'));
    assert.ok(check(data.boolean, 'any'));
  });

  it('undefined', () => {
    assert.ok(check(undefined, undefined));
    assert.ok(!check(undefined, 'any'));
    assert.ok(!check(data.undefined, null));
    assert.ok(check(data.undefined, undefined));
  });

  it('null', () => {
    assert.ok(check(null, null), 'null is null');
    assert.ok(!check(null, 'any'), 'null is not any');
    assert.ok(!check(null, undefined), 'null is not undefined');
    assert.ok(check(data.null, null), 'null property is null');
    assert.ok(!check(data.null, undefined), 'null property not undefined');
  });

  it('multiple', () => {
    assert.ok(check(data.string, [Object, String]));
    assert.ok(check(data.object, [Object, String]));
    assert.ok(!check(data.array, [Object, String]));
  });

  it('custom class', () => {
    assert.ok(check(data.customObject, Object), 'is an object');
    assert.ok(check(data.customObject, CustomType), 'matches class constructor');
  });

  return it('error', () => {
    assert.ok(!check(data.error, Object));
    assert.ok(!check(data.error, Array));
    assert.ok(!check(data.error, String));
    assert.ok(!check(data.error, Number));
    return assert.ok(check(data.error, 'Error'));
  });
});
