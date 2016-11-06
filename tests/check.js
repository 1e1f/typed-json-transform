import {assert} from 'chai';

import {check} from '../lib';

const data = {
  object: {},
  objectArray: {
    0: 'value'
  },
  date: new Date(),
  array: [],
  number: 1,
  stringNumber: '1',
  complexStringNumber: '1.0.1',
  string: 'hello',
  error: new SyntaxError(),
  boolean: true
};

describe('check', () => {
  it('object', () => {
    assert.ok(check(data.object, Object));
    assert.ok(!check(data.object, Array));
    assert.ok(!check(data.objectArray, Array));
    assert.ok(!check(data.object, String));
    return assert.ok(!check(data.object, Number));
  });

  it('array', () => {
    assert.ok(!check(data.array, Object));
    assert.ok(check(data.array, Array));
    assert.ok(!check(data.array, String));
    return assert.ok(!check(data.array, Number));
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
    assert.ok(check(data.date, 'any'));
    assert.ok(check(data.boolean, 'any'));
  });

  it('multiple', () => {
    assert.ok(check(data.string, [Object, String]));
    assert.ok(check(data.object, [Object, String]));
    assert.ok(!check(data.array, [Object, String]));
  });

  return it('error', () => {
    assert.ok(!check(data.error, Object));
    assert.ok(!check(data.error, Array));
    assert.ok(!check(data.error, String));
    assert.ok(!check(data.error, Number));
    return assert.ok(check(data.error, 'Error'));
  });
});
