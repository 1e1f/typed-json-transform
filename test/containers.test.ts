import { assert } from 'chai';
import { makeA, makeB, makeC, makeD, makeZ } from './fixtures';

import { isEqual, check, combine, combineN, any, every, contains, extend, extendN, clone, arrayify, union, difference } from '../src';

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
    const test = makeZ();
    it('can make a deep copy of an object', () => {
        const cloned = clone(test);
        assert.deepEqual(cloned, test);
    });
    it('does not mutate original', () => {
        assert.deepEqual(test, makeZ());
    });
    it('can clone an object with a recursive reference', () => {
        const a = {
            num: 1,
            self: {}
        }
        a.self = a;
        const cloned = clone(a);
        assert.deepEqual(cloned, a);
    });
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

});

describe('extend', () => {
    const a = makeA();
    const b = makeB();
    const d = makeD();
    extendN(a, b, d);
    it('can combine 2 objects into a new object', () => {
        const res = combine(a, b);
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
});
