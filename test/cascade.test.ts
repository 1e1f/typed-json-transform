import { assert } from 'chai';
import { each, select, cascade, hashField } from '../src';


const keywords = [
  'win',
  'mac',
  'linux',
  'ios',
  'android',
  'x64',
  'x86',
  'simulator',
  'clang',
  'gcc',
  'clion'
];

const testAObject = {
  useAccel: -1,
  'win, linux': {
    useAccel: 0,
    x86: {
      useAccel: 1
    },
    x64: {
      useAccel: 2
    }
  },
  'mac, ios': {
    useAccel: 3,
    x86: {
      useAccel: 4
    },
    x64: {
      useAccel: 5
    }
  }
};

const testASelectors = [
  [
    'mac', 'x64'
  ],
  ['win'],
  ['win', 'x64']
];

const testAExpected = [
  {
    useAccel: 5
  }, {
    useAccel: 0
  }, {
    useAccel: 2
  }
];

const testObjB = {
  'mac, ios': {
    flag: true
  },
  other: 'setting',
  build: {
    with: 'error A',
    'mac, ios': {
      matching: ['apple.c']
    },
    'mac': {
      with: 'cmake'
    }
  },
  x64: {
    build: {
      with: 'error C',
      'mac': {
        with: 'ninja',
        clion: {
          with: 'cmake'
        }
      }
    }
  },
  win: {
    build: {
      with: {
        x64: 'clang',
        x86: 'gcc'
      }
    }
  }
};

const testBSelectors = [
  [
    'mac', 'x64'
  ],
  [
    'mac', 'x64', 'clion'
  ],
  ['win'],
  ['win', 'x64']
];

const testBExpected = [
  {
    flag: true,
    other: 'setting',
    build: {
      with: 'ninja',
      matching: ['apple.c']
    }
  }, {
    flag: true,
    other: 'setting',
    build: {
      with: 'cmake',
      matching: ['apple.c']
    }
  }, {
    build: {
      with: 'error A'
    },
    other: 'setting'
  }, {
    build: {
      with: 'clang'
    },
    other: 'setting'
  }
];

const testObjC = {
  clang: {
    ios: {
      arch: 'arm64'
    },
    arch: 'x86'
  }
};

const testCSelectors = [
  [
    'ios', 'clang'
  ],
  ['linux', 'gcc']
];

const testCExpected = [
  {
    arch: 'arm64'
  }, {}
];

describe('should return 1 if', () => {
  it('a match a', () => {
    assert.equal(select(['a'], 'a'), 1);
  });
  it(`a match !b`, () => {
    assert.equal(select([
      'a',
    ], '!b'), 1);
  });
  it('a match a || b', () => {
    assert.equal(select([
      'a'
    ], 'a, b'), 1);
  });
  it('[a, b, c] match a || b || !c', () => {
    assert.equal(select([
      'a', 'b', 'c'
    ], 'a, b, !c'), 1);
  });
});

describe('should return 2 if', () => {
  it('[a] match a && !c', () => {
    assert.equal(select([
      'a',
    ], 'a !c'), 2);
  });

  it('[a, b] match a && b', () => {
    assert.equal(select([
      'a', 'b'
    ], 'a b'), 2);
  });

  it('[a, b, c] match (a && b) || c', () => {
    assert.equal(select([
      'a', 'b', 'c'
    ], 'a b, c'), 2);
  });
});

describe('should return 3 if', () => {
  it('[a, b] match a && b && !c', () => {
    assert.equal(select([
      'a', 'b'
    ], 'a b !c'), 3);
  });
});

describe(`should return 0 if`, () => {
  it(`a match b`, () => {
    assert.equal(select([
      'a',
    ], 'b'), 0);
  });
  it(`a match !a`, () => {
    assert.equal(select([
      'a'
    ], '!a'), 0);
  });
  it('a match a && b', () => {
    assert.equal(select([
      'a'
    ], 'c, a b'), 0);
  });
  it('[a, b] match a && !b', () => {
    assert.equal(select([
      'a', 'b'
    ], 'c, a !b'), 0);
  });
  it('[a, b, c] match (a && !b) || (b && !c) || (c && !a)', () => {
    assert.equal(select([
      'a', 'b', 'c'
    ], 'a !b, b !c, c !a'), 0);
  });
});


describe('arrays', () => {
  it(`ignores unmatched keywords`, () => {
    const selectors = ['mac']
    const conf = {
      build: {
        with: 'ninja',
        matching: {
          "mac x64": ['main.c'],
          mac: ['mac.c']
        }
      }
    }
    const result = cascade(conf, keywords, selectors);
    const expected = {
      build: {
        with: 'ninja',
        matching: ['mac.c']
      }
    }
    assert.deepEqual(result, expected);
  });
  it(`merges arrays`, () => {
    const selectors = ['mac'];
    const tree = {
      matching: ['main.c'],
      mac: {
        matching: ['mac.c']
      }
    }
    const result = cascade(tree, keywords, selectors);
    const expected = {
      matching: ['main.c', 'mac.c']
    }
    assert.deepEqual(result, expected);
  });
});

describe('objects', () => {
  it(`more specific operates last`, () => {
    const selectors = ['mac', 'x64']
    const conf = {
      build: {
        with: 'ninja',
        matching: {
          "mac x64": ['main.c'],
          mac: ['mac.c']
        }
      }
    }
    const result = cascade(conf, selectors, selectors);
    const expected = {
      build: {
        with: 'ninja',
        matching: ['mac.c', 'main.c']
      }
    }
    assert.deepEqual(result, expected);
  });

  it(`merges falsey values`, () => {
    const selectors = ['mac', 'x64']
    const conf = {
      build: {
        with: 'ninja',
        matching: {
          "mac x64": 1,
          mac: ['mac.c']
        },
        "mac x64": {
          matching: 0
        }
      }
    }
    const result = cascade(conf, selectors, selectors);
    const expected = {
      build: {
        with: 'ninja',
        matching: 0
      }
    }
    assert.deepEqual(result, expected);
  });

  it(`merges empty objects`, () => {
    const selectors = ['mac', 'x64']
    const conf = {
      matching: {}
    }
    const result = cascade(conf, selectors, selectors);
    const expected = {
      matching: {}
    }
    assert.deepEqual(result, expected);
  });

  for (const i in testASelectors) {
    it(`selects A${i} ${testASelectors[i]}`, () => {
      const result = cascade(testAObject, keywords, testASelectors[i]);
      assert.deepEqual(result, testAExpected[i]);
    });
  }
  for (const i in testBSelectors) {
    it(`selects B${i} ${testBSelectors[i]}`, () => {
      const result = cascade(testObjB, keywords, testBSelectors[i]);
      assert.deepEqual(result, testBExpected[i]);
    });
  }
  for (const i in testCSelectors) {
    it(`selects C${i} ${testCSelectors[i]}`, () => {
      const result = cascade(testObjC, keywords, testCSelectors[i]);
      assert.deepEqual(result, testCExpected[i]);
    });
  }
});



describe('hash field', () => {
  const environment = {
    mac: true,
    linux: false,
    production: true,
    debug: false,
    overriddenOption: false
  }

  const config = {
    defaultOption: true,
    overriddenOption: true,
    selectedOption: {
      mac: true,
      linux: false
    },
    unselectedOption: {
      production: false
    }
  }

  it(`can parse`, () => {
    const res = hashField(config, environment);
    assert.deepEqual(res, {
      selectedOption: true,
      unselectedOption: false,
      defaultOption: true,
      overriddenOption: false
    });
  });
});
