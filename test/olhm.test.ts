import { assert } from 'chai';
import { load } from 'js-yaml';
import * as fs from 'fs';

import { check, safeOLHM, mapOLHM, okmapOLHM, reduceOLHM} from '../src';
import { isOLHV, safeOLHV } from '../src/olhm';

const yamlFile = fs.readFileSync('test/olhm.yaml', 'utf8');
const o = load(yamlFile);
const inputs = o.inputs;
const results = o.results;

describe('olhv', () => {
  it('can check if a value requires another value', () => {
    assert.equal(isOLHV(inputs.a), false, 'simpleValue');
    assert.equal(isOLHV(inputs.b), false, `${inputs.b}`);
    assert.equal(isOLHV(inputs.b.objectValue), false, `${inputs.b.objectValue}`);
    assert.equal(isOLHV(inputs.d.namedItemA), true, `olhv ${inputs.d.namedItemA}`);
  });
  it('can parse optionally linked values into plain objects', () => {
    assert.equal(safeOLHV(inputs.a), inputs.a, 'simpleValue');
    assert.deepEqual(safeOLHV(inputs.b), inputs.b, `${inputs.b}`);
    assert.deepEqual(safeOLHV(inputs.b.objectValue), inputs.b.objectValue, `${inputs.b.objectValue}`);
    assert.deepEqual(safeOLHV(inputs.d.namedItemA), inputs.d.namedItemA.value, `olhv ${inputs.d.namedItemA}`);
  });
});

describe('olhm', () => {
  it('undefined yields empty array', () => {
    const res = safeOLHM(inputs.undefined);
    assert.deepEqual(res, []);
  });
  it('throws on a simple value', () => {
    try {
      const res = safeOLHM(inputs.a);
      assert.fail(res);
    } catch (e) {
      assert.equal(e.message, 'OLHM expects an object as input');
    }
  });
  it('correctly parses an object value', () => {
    const res = safeOLHM(inputs.b);
    assert.deepEqual(res, results.b);
  });
  it('correctly parses a named list', () => {
    const res = safeOLHM(inputs.c);
    assert.deepEqual(res, results.c);
  });
  it('correctly parses an ordered, named list', () => {
    const res = safeOLHM(inputs.d);
    assert.deepEqual(res, results.d);
  });
  it('correctly parses an ordered, named list with nested values', () => {
    const res = safeOLHM(inputs.e);
    assert.deepEqual(res, results.e);
  });
  it('correctly maps and ordered list to an array with a supplied function', () => {
    const res = mapOLHM(inputs.map, (v, k) => {
      assert.ok(check(k, String));
      return v * 2;
    });
    assert.deepEqual(res, results.map);
  });
  it('correctly okmaps and ordered list to different values', () => {
    const res = okmapOLHM(inputs.map, (v, k) => {
      assert.ok(check(k, String));
      return v * 2;
    });
    assert.deepEqual(res, results.okmap);
  });
  it('correctly reduces and ordered list to a sum with a supplied function', () => {
    const res = reduceOLHM(inputs.map, (memo, v, i) => {
      assert.ok(check(i, Number));
      return memo + (v * 2);
    }, 0);
    assert.deepEqual(res, 120);
  });
  it('did not mutate the input objects', () => {
    const original = load(yamlFile);
    for (const section of Object.keys(original)) {
      for (const item of Object.keys(original[section])) {
        assert.ok(o[section][item]);
        assert.deepEqual(o[section][item], original[section][item], `${section}:${item}`);
      }
    }
  });
});
