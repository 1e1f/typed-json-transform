import _ from 'lodash';
import {assert} from 'chai';

import {diff} from '../lib';

function objectEqual(result, expected) {
  assert.deepEqual(result, expected, `${JSON.stringify(result, 0, 2)} '!=' ${JSON.stringify(expected, 0, 2)}`);
}

const basicObject = {
  a: {
    b: 'c'
  }
};

describe('diff', () => {
  it('can make a deep copy of an object', () => {
    const cloned = diff.clone(basicObject);
    objectEqual(cloned, basicObject);
  });

  it('getters do not mutate original', () => {
    const cloned = diff.clone(basicObject);
    diff.valueForKeyPath('a.b', basicObject);
    diff.diffToModifier(basicObject, cloned);
    diff.forwardDiffToModifier(basicObject, cloned);
    diff.modifierToObj(basicObject);
    diff.allKeyPaths(basicObject);
    diff.flatObject(basicObject);
    diff.clone(basicObject);
    diff.combine(basicObject, basicObject);
    diff.stringify(basicObject);
    objectEqual(cloned, basicObject);
  });

  it('can combine 2 objects into a new object', () => {
    const res = diff.combine({
      a: 'b',
      c: 'z'
    }, {
      c: 'd',
      e: 'f'
    });
    assert.deepEqual(res, {
      a: 'b',
      c: 'd',
      e: 'f'
    });
  });

  it('can get value at Keypath', () => {
    const res = diff.valueForKeyPath('a.b', basicObject);
    assert.equal(res, basicObject.a.b);
  });

  it('can setValueForKeyPath', () => {
    const obj = {};
    diff.setValueForKeyPath('f', 'a.b.c.d.e', obj);
    assert.equal('f', obj.a.b.c.d.e);
  });

  it('unset keypath mutates original', () => {
    const obj = {
      a: {
        b: {
          c: {
            d: {
              e: 'f'
            }
          }
        }
      }
    };
    diff.unsetKeyPath('a.b.c.d.e', obj);
    objectEqual(obj, {
      a: {
        b: {
          c: {
            d: {}
          }
        }
      }
    });
  });

  it('prune mutates original', () => {
    const obj = {
      a: {
        b: {
          c: {
            d: {
              e: {}
            }
          }
        }
      }
    };
    diff.prune(obj);
    objectEqual(obj, {});
  });

  it('can convert a mongo modifier to an object', () => {
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

  it('can expand an object to ALL keypath levels', () => {
    const flat = diff.flatObject({
      a: {
        b: {
          c: {
            d: 'here\'s a thing'
          }
        }
      }
    });
    objectEqual(flat, {
      'a.b.c.d': 'here\'s a thing',
      'a.b.c': {
        d: 'here\'s a thing'
      },
      'a.b': {
        c: {
          d: 'here\'s a thing'
        }
      },
      a: {
        b: {
          c: {
            d: 'here\'s a thing'
          }
        }
      }
    });
  });

  it('can flatten an object to corresponding keypaths', () => {
    const flat = diff.flatterObject({
      a: {
        b: {
          c: {
            d: 'here\'s a thing'
          }
        }
      }
    });
    objectEqual(flat, {'a.b.c.d': 'here\'s a thing'});
  });

  it('can get all object props as keypaths', () => {
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

  it('can unset leaves and their branches', () => {
    const a = {
      b: 'leaf',
      c: {
        d: 'leaf',
        e: {
          f: 'leaf',
          g: 'leaf'
        }
      }
    };
    const z = {
      b: 'leaf',
      c: {
        d: 'leaf'
      }
    };
    const modifier = diff.diffToModifier(a, z);
    diff.apply(a, modifier);
    objectEqual(a, z);
  });

  return it('can produce a diff of only keys added, and apply those changes', () => {
    const a = {
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
    const b = {
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

    const modifier = diff.diffToModifier(a, b);
    diff.apply(a, modifier);
    assert.deepEqual(a, b, `failed with modifier ${JSON.stringify(modifier, 0, 2)}`);
  });
});
