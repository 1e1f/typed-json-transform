import { assert } from 'chai';
import { load } from 'js-yaml';
import fs from 'fs';

import { isOLHV, safeOLHM, safeOLHV } from '../lib/olhm';

describe('olhm', () => {
    const yamlFile = fs.readFileSync('test/olhm.yaml');
    const o = load(yamlFile);
    const inputs = o.inputs;
    const results = o.results;

    it('knows if a value requires another value', () => {
        assert.equal(isOLHV(inputs.a), false, 'simpleValue');
        assert.equal(isOLHV(inputs.b), false, `${inputs.b}`);
        assert.equal(isOLHV(inputs.b.objectValue), false, `${inputs.b.objectValue}`);
        assert.equal(isOLHV(inputs.d.namedItemA), true, `olhv ${inputs.d.namedItemA}`);
    });
    it('can parse optionally linked values', () => {
        assert.equal(safeOLHV(inputs.a), inputs.a, 'simpleValue');
        assert.deepEqual(safeOLHV(inputs.b), inputs.b, `${inputs.b}`);
        assert.deepEqual(safeOLHV(inputs.b.objectValue), inputs.b.objectValue, `${inputs.b.objectValue}`);
        assert.deepEqual(safeOLHV(inputs.d.namedItemA), inputs.d.namedItemA.value, `olhv ${inputs.d.namedItemA}`);
    });
    it('correctly parses an undefined value', () => {
        const res = safeOLHM(inputs.undefined);
        assert.deepEqual(res, []);
    });
    it('correctly parses a simple value', () => {
        const res = safeOLHM(inputs.a);
        assert.deepEqual(res, results.a);
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
    it('correctly parses an ordered, named list', () => {
        const res = safeOLHM(inputs.e);
        assert.deepEqual(res, results.e);
    });
    it('does not mutate', () => {
        const original = load(yamlFile);
        for (const section of Object.keys(original)) {
            for (const item of Object.keys(original[section])) {
                assert.ok(o[section][item])
                assert.deepEqual(o[section][item], original[section][item], `${section}:${item}`);
            }
        }
    });
});