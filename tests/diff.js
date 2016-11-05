import _ from 'lodash';
import {assert} from 'chai';

import {diff} from '../lib';

function objectEqualityTest(result, expected) {
  return assert.deepEqual(result, expected, `${JSON.stringify(result)} '!=' ${JSON.stringify(expected)}`);
}

describe('diff', () => {
  it('can setValueForKeyPath', () => {
    const obj = {};
    diff.setValueForKeyPath('f', 'a.b.c.d.e', obj);
    return objectEqualityTest('f', obj.a.b.c.d.e);
  });

  it('can unset a keypath in pace', () => {
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
    return objectEqualityTest(obj, {
      a: {
        b: {
          c: {
            d: {}
          }
        }
      }
    });
  });

  it('will prune an empty object', () => {
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
    diff.prune(obj);
    return objectEqualityTest(obj, {});
  });

  it('can convert a mongo modifier to an object', () => {
    const modifier = {};
    modifier.$set = {
      'array.4': '5th element'
    };
    modifier.$unset = {
      'emptyObject': ''
    };
    const obj = diff.modifierToObj(modifier);
    assert.equal(obj.array[4], '5th element');
    return assert.equal(obj.emptyObject, '');
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
    return objectEqualityTest(flat, {'a.b.c.d': 'here\'s a thing'});
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
    return objectEqualityTest(flat, {
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
    return assert(_.every(list, expected => {
      return _.contains(keypaths, expected);
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
    modifier.apply(a, diff);
    return objectEqualityTest(a, z);
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
    modifier.$update(a, diff);
    return objectEqualityTest(a, b);
  });
});
