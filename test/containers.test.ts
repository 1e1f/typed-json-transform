import { assert } from 'chai';
import { makeA, makeB, makeC, makeD, makeZ } from './fixtures';
import { readFileSync } from 'fs';
import { load } from 'js-yaml';
import { isEqual, check, combine, combineN, any, each, every, flatten, contains, extend, extendN, intersect, clone, arrayify, map, merge, okmap, union, difference } from '../src';

describe('isEqual', () => {
    it('isEqual', () => {
        assert.ok(isEqual(
            { a: [2, 3], b: [4] },
            { a: [2, 3], b: [4] }
        ));
    });

    it('not isEqual', () => {
        assert.notOk(isEqual(
            { x: 5, y: [6] },
            { x: 5, y: 6 }
        ));
    });

    it('nested nulls', () => {
        assert.ok(isEqual([null, null, null], [null, null, null]));

    });

    it('strict isEqual', () => {
        assert.notOk(isEqual(
            [{ a: 3 }, { b: 4 }],
            [{ a: '3' }, { b: '4' }],
            { strict: true }
        ));
    });

    it('non-objects', () => {
        assert.ok(isEqual(3, 3));
        assert.ok(isEqual('beep', 'beep'));
        assert.ok(isEqual('3', 3));
        assert.notOk(isEqual('3', 3, { strict: true }));
        assert.notOk(isEqual('3', [3]));
    });

    it('arguments class', () => {
        assert.ok(isEqual(
            function (a, b, c) { return arguments }(1, 2, 3),
            function (a, b, c) { return arguments }(1, 2, 3),
        ), 'compares arguments');
        assert.notOk(isEqual(
            function (a, b, c) { return arguments }(1, 2, 3),
            [1, 2, 3]
        ), 'differenciates array and arguments');
    });

    it('dates', () => {
        const d0 = new Date(1387585278000);
        const d1 = new Date('Fri Dec 20 2013 16:21:18 GMT-0800 (PST)');
        assert.ok(isEqual(d0, d1));

    });

    it('buffers', () => {
        assert.ok(isEqual(new Buffer('xyz'), new Buffer('xyz')));
    });

    it('booleans and arrays', () => {
        assert.notOk(isEqual(true, []));

    })

    it('null == undefined', () => {
        assert.ok(isEqual(null, undefined))
        assert.notOk(isEqual(null, undefined, { strict: true }))
    })
});

describe('clone', () => {
    const date = new Date();
    const test = makeZ(date);
    it('can make a deep copy of an object', () => {
        const cloned = clone(test);
        assert.deepEqual(cloned, test);
    });
    it('does not mutate original', () => {
        assert.deepEqual(test, makeZ(date));
    });
    // it('can clone an object with a recursive reference', () => {
    //     const a = {
    //         num: 1,
    //         self: {}
    //     }
    //     a.self = a;
    //     const cloned = clone(a);
    //     assert.deepEqual(cloned, a);
    // });
});


describe('arrayify', () => {
    const array = [1, 1];
    const obj = makeA();
    const string = 'hello';

    it('converts obj to array', () => {
        assert.deepEqual(arrayify(obj)[0], obj);
    });
    it('leaves string to array', () => {
        assert.ok(arrayify(string)[0] === 'hello');
    });
    it('leaves array alone', () => {
        assert.ok(arrayify(array)[1] === 1);
    });
});

describe('every, any', () => {
    const all = [1, 1, 1];
    const some = [1, 0, 1, 1];
    const none = [0, 0, 0];

    function posInt(input: number) {
        return check(input, Number) && input > 0;
    }
    it('every', () => {
        assert.ok(every(all, posInt));
        assert.ok(!every(some, posInt));
        assert.ok(!every(none, posInt));
    });

    it('any', () => {
        assert.ok(any(all, posInt));
        assert.ok(any(some, posInt));
        assert.ok(!any(none, posInt));
    });
});

describe('arrays', () => {
    it('union', () => {
        assert.deepEqual(union([1, 2, 3], [101, 2, 1, 10], [2, 1]), [1, 2, 3, 101, 10]);
    });
    it('difference', () => {
        assert.deepEqual(difference([1, 2, 3, 4, 5], [5, 2, 10]), [1, 3, 4]);
    });
    it('intersect', () => {
        assert.deepEqual(intersect([1, 2, 3, 4, 5], [1, 2], [2, 7]), [2]);
    });
    it('flatten', () => {
        assert.deepEqual(flatten([[1, 2], [3], [4, [5]]]), [1, 2, 3, 4, 5]);
    });
});

class toExtend {
    myFunc() {
        return 'result';
    }
}

describe('extend', () => {
    const a = makeA();
    const b = makeB();
    const d = makeD();
    const f = { f: makeD };
    it('extend object with multiple objects', () => {
        extendN(a, b, d, f);
        assert.deepEqual(a, <any>{
            a: {
                b: {
                    c: 0
                }
            },
            c: 'd',
            e: 'f',
            f: makeD
        });
    });

    it('extend a class into an object', () => {
        const inherits = {};
        const instance = new toExtend();
        extend(inherits, instance);
        assert.deepEqual(inherits, instance);
    });
});

describe('combine', () => {
    const a = makeA();
    const b = makeB();
    const d = makeD();
    it('can combine 2 objects into a new object', () => {
        const res = combine(a, b);
        assert.deepEqual(res, {
            a: 'b',
            c: 'd',
            e: 'f'
        });
    });

    it('does not mutate original', () => {
        assert.deepEqual(a, makeA());
        assert.deepEqual(b, makeB());
    });

    it('can combine nested objects', () => {
        const res = combine(b, d);
        assert.deepEqual(res, {
            a: {
                b: {
                    c: 0
                }
            },
            c: 'd',
            e: 'f'
        });
    });
});

describe('merge', function () {
    const yamlFile = readFileSync('test/merge.yaml', 'utf8');
    const o = load(yamlFile);

    const { operators, arrayOperators, complex } = o.expect;

    Object.keys(operators).forEach((key) => {
        const expected = operators[key];
        it('object: ' + key, () => {
            const { a, b } = clone(o.fixtures);
            const actual = merge(a, b, { objectMergeMethod: <any>key[1] });
            assert.deepEqual(actual, expected);
        });
    })

    Object.keys(arrayOperators).forEach((key) => {
        it('array: ' + key, () => {
            const { c, d } = clone(o.fixtures);
            const actual = merge(c, d, { arrayMergeMethod: <any>key[1] });
            assert.deepEqual(actual, arrayOperators[key]);
        });
    })

    const { complexA, complexB } = o.fixtures;

    each(complexB, (b, name) => {
        const a = clone(complexA);
        const expected = complex[name];
        it('complex merge ' + name, () => {
            const actual = merge(a, b);
            assert.deepEqual(actual, expected);
        });
    })
})

describe('collections', () => {
    it('every', () => {
        const list = ['a', 'b', 'a.c', 'b.d'];
        const sameList = ['a', 'b', 'a.c', 'b.d'];
        for (const s of list) {
            assert.ok(contains(sameList, s), `contains ${s}`);
        }
        assert.ok(every(list, (s: string) => {
            return contains(sameList, s);
        }));
    });

    it('okmap with object input', () => {
        const test = {
            a: 1,
            b: 2,
            c: 3,
        }
        const expect = {
            a: 7,
            x: 2,
            c: 3,
        }
        const res = okmap(test, (v, k) => {
            switch (k) {
                case 'a': return 7;
                case 'b': return { key: 'x', value: v }
            }
        });
        assert.deepEqual(expect, <any>res, 'okmap');
    });

    it('okmap with array input', () => {
        const test = [
            1,
            2,
            3,
        ]
        const expect = {
            0: 7,
            x: 2,
            2: 0,
        }
        const res = okmap(test, (v, k) => {
            switch (k) {
                case 0: return <any>7;
                case 1: return { key: 'x', value: v };
                default: return 0;
            }
        });
        assert.deepEqual(res, expect, 'okmap');
    });

    it('okmap with complex input', () => {
        const test = {
            a: { value: 1 },
            b: { value: 2 },
            c: { value: 3 },
        }
        const expect = {
            a: { value: 7 },
            x: { value: 2 },
            c: { value: 3 },
        }
        const res = okmap(test, (v, k) => {
            switch (k) {
                case 'a': return { value: 7 };
                case 'b': return { key: 'x', value: { value: 2 } };
            }
        });
        assert.deepEqual(expect, <any>res, 'okmap');
    });
});
