import _ from 'lodash';
import {assert} from 'chai';

import {diff} from '../lib';

function objectEqual(result, expected) {
  assert.deepEqual(result, expected, `${JSON.stringify(result, 0, 2)} '!=' ${JSON.stringify(expected, 0, 2)}`);
}

function makeA() {
  return {a: 'b', c: 'z'};
}

function makeB() {
  return {c: 'd', e: 'f'};
}

function makeC() {
  return {
    a: {
      b: {}
    }
  };
}

function makeD() {
  return {
    a: {
      b: {
        c: 'd'
      }
    }
  };
}

function makeZ() {
  return {
    0: 'arrayLikeThing',
    a: {
      b: 'c'
    },
    z: [7, 7, 7]
  };
}

describe('clone', () => {
  const test = makeZ();
  it('can make a deep copy of an object', () => {
    const cloned = diff.clone(test);
    objectEqual(cloned, test);
  });
  it('does not mutate original', () => {
    objectEqual(test, makeZ());
  });
});

describe('combine', () => {
  const a = makeA();
  const b = makeB();
  it('can combine 2 objects into a new object', () => {
    const res = diff.combine(a, b);
    assert.deepEqual(res, {
      a: 'b',
      c: 'd',
      e: 'f'
    });
  });
  it('does not mutate original', () => {
    objectEqual(a, makeA());
    objectEqual(b, makeB());
  });
});

describe('keyPaths', () => {
  it('allKeyPaths', () => {
    const object = {
      a: {
        c: 'here\'s a thing'
      },
      b: {
        d: 'here\'s another thing'
      }
    };
    const keypaths = diff.allKeyPaths(object);
    const list = ['a', 'b', 'a.c', 'b.d'];
    assert(_.every(list, expected => {
      return diff.contains(keypaths, expected);
    }));
  });

  it('valueForKeyPath', () => {
    const testObj = makeZ();
    const res = diff.valueForKeyPath('a.b', testObj);
    assert.equal(res, testObj.a.b);
  });

  it('setValueForKeyPath', () => {
    const obj = {};
    diff.setValueForKeyPath('d', 'a.b.c', obj);
    assert.equal('d', obj.a.b.c);
    assert.deepEqual(obj, makeD());
  });

  it('unsetKeyPath mutates', () => {
    const testObj = makeD();
    diff.unsetKeyPath('a.b.c', testObj);
    objectEqual(testObj, makeC());
  });

  it('prune mutates', () => {
    const testObj = makeC();
    diff.prune(testObj);
    objectEqual(testObj, {});
  });
});

describe('diff', () => {
  it('modifierToObj', () => {
    const modifier = {};
    modifier.$set = {
      'array.4': '5th element'
    };
    modifier.$unset = {
      emptyObject: undefined
    };
    const obj = diff.modifierToObj(modifier);
    assert.equal(obj.array[4], '5th element');
    assert.equal(obj.emptyObject, undefined);
  });

  it('flatObject', () => {
    const flat = diff.flatObject(makeD());
    objectEqual(flat, {'a.b.c': 'd'});
  });

  it('flatObject {includeBranches: true}', () => {
    const flat = diff.flatObject(makeD(), {includeBranches: true});
    objectEqual(flat, {
      'a.b.c': 'd',
      'a.b': {
        c: 'd'
      },
      a: {
        b: {
          c: 'd'
        }
      }
    });
  });

  it('modifier', () => {
    const testObj = makeA();
    const modifier = diff.diffToModifier(testObj, makeB());
    assert.deepEqual(testObj, makeA());
    assert.deepEqual(modifier, {
      $set: {
        c: 'd',
        e: 'f'
      },
      $unset: {
        a: true
      }
    });
  });

  it('forwardModifier', () => {
    const testObj = makeA();
    const modifier = diff.forwardDiffToModifier(testObj, makeB());
    assert.deepEqual(testObj, makeA());
    assert.deepEqual(modifier, {
      $set: {
        c: 'd',
        e: 'f'
      }
    });
  });

  it('apply', () => {
    const testObj = makeA();
    const modifier = diff.diffToModifier(testObj, makeB());
    diff.apply(testObj, modifier);
    assert.deepEqual(testObj, makeB());
  });

  return it('apply (complex)', () => {
    const messA = {
      string: 'alpha',
      nestedA: {
        array: [
          1,
          2,
          3, {
            nO1: 'v1',
            nA: [0, 1, 2]
          },
          [3, 2, 1]
        ],
        nestedB: {
          string: 'beta',
          array: [
            3,
            2, {
              nO1: 'v2',
              nA: [0, 2]
            }, {
              anotherKey: true
            },
            [
              1,
              2,
              [
                1, {
                  two: 2
                }
              ]
            ]
          ]
        }
      }
    };
    const messB = {
      nestedA: {
        array: [
          3,
          2, {
            nO1: 'v2',
            nA: [0, 2]
          }, {
            anotherKey: true
          },
          [
            1,
            2,
            [
              1, {
                two: 2
              }
            ]
          ]
        ],
        nestedB: {
          array: [
            1,
            2,
            3, {
              nO1: 'v1',
              nA: [0, 1, 2]
            },
            [3, 2, 1]
          ],
          string: 'it\'s a delta'
        }
      }
    };

    const modifier = diff.diffToModifier(messA, messB);
    diff.apply(messA, modifier);
    assert.deepEqual(messA, messB, `failed with modifier ${JSON.stringify(modifier, 0, 2)}`);
  });
});
