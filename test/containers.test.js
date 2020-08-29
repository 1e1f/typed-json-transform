import { describe, it } from "mocha";
import { assert, expect } from "chai";
import { makeA, makeB, makeC, makeD, makeZ } from "./fixtures";
import { readFileSync } from "fs";
import { load, dump } from "js-yaml";
import {
  amap,
  isEqual,
  check,
  combine,
  combineN,
  any,
  each,
  every,
  flatten,
  contains,
  extend,
  extendN,
  intersect,
  clone,
  arrayify,
  map,
  merge,
  okmap,
  union,
  difference,
  keysAndValues,
  aokmap,
  mergeLhsArray,
  mergeLhsObject,
} from "../esm";
import { Schema } from "mongoose";

import { SimpleClass, HasCopyMethod } from "../esm/fixtures";

describe("isEqual", () => {
  it("isEqual", () => {
    assert.ok(isEqual({ a: [2, 3], b: [4] }, { a: [2, 3], b: [4] }));
  });

  it("not isEqual", () => {
    assert.notOk(isEqual({ x: 5, y: [6] }, { x: 5, y: 6 }));
  });

  it("nested nulls", () => {
    assert.ok(isEqual([null, null, null], [null, null, null]));
  });

  it("strict isEqual", () => {
    assert.notOk(
      isEqual([{ a: 3 }, { b: 4 }], [{ a: "3" }, { b: "4" }], { strict: true })
    );
  });

  it("non-objects", () => {
    assert.ok(isEqual(3, 3));
    assert.ok(isEqual("beep", "beep"));
    assert.ok(isEqual("3", 3));
    assert.notOk(isEqual("3", 3, { strict: true }));
    assert.notOk(isEqual("3", [3]));
  });

  it("arguments class", () => {
    assert.ok(
      isEqual(
        (function (a, b, c) {
          return arguments;
        })(1, 2, 3),
        (function (a, b, c) {
          return arguments;
        })(1, 2, 3)
      ),
      "compares arguments"
    );
    assert.notOk(
      isEqual(
        (function (a, b, c) {
          return arguments;
        })(1, 2, 3),
        [1, 2, 3]
      ),
      "differenciates array and arguments"
    );
  });

  it("dates", () => {
    const d0 = new Date(1387585278000);
    const d1 = new Date("Fri Dec 20 2013 16:21:18 GMT-0800 (PST)");
    assert.ok(isEqual(d0, d1));
  });

  it("buffers", () => {
    assert.ok(isEqual(new Buffer("xyz"), new Buffer("xyz")));
  });

  it("booleans and arrays", () => {
    assert.notOk(isEqual(true, []));
  });

  it("null == undefined", () => {
    assert.ok(isEqual(null, undefined));
    assert.notOk(isEqual(null, undefined, { strict: true }));
  });
});

describe("clone", () => {
  const date = new Date();
  const test = makeZ(date);
  it("can make a deep copy of an object", () => {
    const cloned = clone(test);
    assert.deepEqual(cloned, test);
  });
  it("does not mutate original", () => {
    assert.deepEqual(test, makeZ(date));
  });
  it("nested objects are not references to original", () => {
    const a = {
      num: 1,
      object: {
        nested: "string",
      },
      array: [{ nested: "1" }, { nested: "2" }],
    };
    const cloned = clone(a);
    assert.deepEqual(a, cloned, "original is deep equal");
    assert.notEqual(a.object, cloned.object);
    assert.notEqual(a.array[0], cloned.array[0]);
  });
  it("nested arrays are not references to original", () => {
    const a = {
      array: [{ nested: "1" }, { nested: "2" }],
    };
    const cloned = clone(a);
    const both = {
      a,
      cloned,
    };
    assert.deepEqual(a, cloned);
    assert.notEqual(a.array[0], cloned.array[0]);
  });
  it("clone a simple class instance", () => {
    const instance = new SimpleClass();
    // extend(inherits, instance);
    assert.deepEqual(clone(instance), instance);
  });
  it("clone a class via clone function", () => {
    const instance = new HasCopyMethod(["a", "b"]);
    // extend(inherits, instance);
    const copy = clone(instance);
    assert.notDeepEqual(copy, instance);
    instance.isClone = true;
    assert.deepEqual(copy, instance);
  });

  it("clone a class definition", () => {
    const Class = Schema.Types.Mixed;
    // extend(inherits, instance);
    assert.deepEqual(clone(Class), Class);
  });
});

describe("arrayify", () => {
  const array = [1, 1];
  const obj = makeA();
  const string = "hello";

  it("converts obj to array", () => {
    assert.deepEqual(arrayify(obj)[0], obj);
  });
  it("leaves string to array", () => {
    assert.ok(arrayify(string)[0] === "hello");
  });
  it("leaves array alone", () => {
    assert.ok(arrayify(array)[1] === 1);
  });
});

describe("every, any", () => {
  const all = [1, 1, 1];
  const some = [1, 0, 1, 1];
  const none = [0, 0, 0];

  function posInt(input) {
    return check(input, Number) && input > 0;
  }
  it("every", () => {
    assert.ok(every(all, posInt));
    assert.ok(!every(some, posInt));
    assert.ok(!every(none, posInt));
  });

  it("any", () => {
    assert.ok(any(all, posInt));
    assert.ok(any(some, posInt));
    assert.ok(!any(none, posInt));
  });
});

describe("arrays", () => {
  it("union", () => {
    assert.deepEqual(union([1, 2, 3], [101, 2, 1, 10], [2, 1]), [
      1,
      2,
      3,
      101,
      10,
    ]);
  });
  it("difference", () => {
    assert.deepEqual(difference([1, 2, 3, 4, 5], [5, 2, 10]), [1, 3, 4]);
  });
  it("intersect", () => {
    assert.deepEqual(intersect([1, 2, 3, 4, 5], [1, 2], [2, 7]), [2]);
  });
  it("flatten", () => {
    assert.deepEqual(flatten([[1, 2], [3], [4, [5]]]), [1, 2, 3, 4, 5]);
  });
});

describe("extend", () => {
  const a = makeA();
  const b = makeB();
  const d = makeD();
  const f = { f: makeD };
  it("extend object with multiple objects", () => {
    extendN(a, b, d, f);
    assert.deepEqual(a, {
      a: {
        b: {
          c: 0,
        },
      },
      c: "d",
      e: "f",
      f: makeD,
    });
  });

  it("ignores extending by an undefined object", () => {
    const inherits = {};
    extend(inherits, undefined);
    assert.deepEqual(inherits, inherits);
  });
});

describe("combine", () => {
  const a = makeA();
  const b = makeB();
  const d = makeD();
  it("can combine 2 objects into a new object", () => {
    const res = combine(a, b);
    assert.deepEqual(res, {
      a: "b",
      c: "d",
      e: "f",
    });
  });

  it("does not mutate original", () => {
    assert.deepEqual(a, makeA());
    assert.deepEqual(b, makeB());
  });

  it("can combine nested objects", () => {
    const res = combine(b, d);
    assert.deepEqual(res, {
      a: {
        b: {
          c: 0,
        },
      },
      c: "d",
      e: "f",
    });
  });
});

describe("merge", function () {
  const yamlFile = readFileSync("test/merge.yaml", "utf8");
  const o = load(yamlFile);

  const { operators, arrayOperators, complex } = o.expect;

  it("merges an object with a false", () => {
    const a = {};
    const b = {
      x: 1,
      b: false,
    };
    mergeLhsObject({ data: a, state: { merge: { operator: "|" } } }, b);
    assert.deepEqual(a, { x: 1, b: false });
  });

  Object.keys(operators).forEach((key) => {
    const expected = operators[key];
    it("object: " + key, () => {
      const { a, b } = clone(o.fixtures);
      const actual = merge(a, b, { merge: { operator: key[1] } });
      assert.deepEqual(actual, expected);
    });
  });

  it("merges an array object with a false", () => {
    const a = [{ any: "value" }];
    const b = [
      {
        x: 1,
        b: false,
      },
    ];
    mergeLhsArray({ data: a, state: { merge: { operator: "|" } } }, b);
    assert.deepEqual(a, [{ any: "value" }, { x: 1, b: false }]);
  });

  Object.keys(arrayOperators).forEach((key) => {
    it("array: " + key, () => {
      const { c, d } = clone(o.fixtures);
      const actual = merge(c, d, { merge: { operator: key[1] } });
      assert.deepEqual(actual, arrayOperators[key]);
    });
  });

  const { complexA, complexB, embedded } = o.fixtures;

  each(complexB, (b, name) => {
    const a = clone(complexA);
    const expected = complex[name];
    it("complex merge " + name, () => {
      const actual = merge(a, b);
      assert.deepEqual(actual, expected);
    });
  });

  each(embedded, (b, name) => {
    it("complex merge " + name, () => {
      const expected = complex[name];
      const actual = merge({}, b);
      assert.deepEqual(actual, expected);
    });
  });
});

describe("collections", () => {
  it("contains", () => {
    const hash = {
      keyA: "A",
    };
    const { keys, values } = keysAndValues(hash);
    assert.equal(contains(keys, "keyA"), 1);
    assert.equal(contains(values, "A"), 1);
    assert.equal(contains(keys, "keyX"), 0);
    assert.equal(contains(values, "X"), 0);
  });
  it("every", () => {
    const list = ["a", "b", "a.c", "b.d"];
    const sameList = ["a", "b", "a.c", "b.d"];
    for (const s of list) {
      assert.ok(contains(sameList, s), `contains ${s}`);
    }
    assert.ok(
      every(list, (s) => {
        return !!contains(sameList, s);
      })
    );
  });
});

describe("amap", () => {
  it("amap", () => {
    const promise = amap([1, 2], (v) => new Promise((r) => r(v * 2)));
    expect(promise).to.be.a("promise");
    return promise.then((res) => expect(res).to.deep.equal([2, 4]));
  });
});

describe("okmap", () => {
  it("object", () => {
    const test = {
      a: 1,
      b: 2,
      c: 3,
    };
    const expected = {
      a: 7,
      x: 2,
      c: 3,
    };
    const res = okmap(test, (v, k) => {
      switch (k) {
        case "a":
          return 7;
        case "b":
          return { key: "x", value: v };
        default:
          return v;
      }
    });
    assert.deepEqual(res, expected, "okmap");
  });

  it("array", () => {
    const test = [1, 2, 3];
    const expected = [7, 2, 0];
    const res = okmap(test, (v, k) => {
      switch (k) {
        case 0:
          return 7;
        case 1:
          return { key: 1, value: v };
        default:
          return 0;
      }
    });
    assert.deepEqual(res, expected, "okmap");
  });

  it("array to object", () => {
    const test = [1, 2, 3];
    const expected = {
      0: 7,
      x: 2,
      2: 0,
    };
    const res = okmap(test, (v, k) => {
      switch (k) {
        case 0:
          return 7;
        case 1:
          return { key: "x", value: v };
        default:
          return 0;
      }
    });
    assert.deepEqual(res, expected, "okmap");
  });

  it("object to array", () => {
    const test = {
      phoenix: {
        place: 0,
      },
      portland: {
        place: 1,
      },
      seattle: {
        place: -1,
      },
    };
    const expected = ["phoenix", "portland"];
    const res = okmap(test, (v, k) => {
      return {
        key: v.place,
        value: k,
      };
    });
    assert.deepEqual(res, expected, "okmap");
  });

  it("complex", () => {
    const test = {
      a: { value: 1 },
      b: { value: 2 },
      c: { value: 3 },
    };
    const expected = {
      a: { value: 7 },
      x: { value: 2 },
      c: { value: 3 },
    };
    const res = okmap(test, (v, k) => {
      switch (k) {
        case "a":
          return { value: 7 };
        case "b":
          return { key: "x", value: { value: 2 } };
        default:
          return v;
      }
    });
    assert.deepEqual(res, expected, "okmap");
  });
});

describe("aokmap", () => {
  it("array", () => {
    const test = [1, 2, 3];
    const promise = aokmap(test, (v, k) => {
      return new Promise((resolve) => {
        switch (k) {
          case 0:
            return resolve(7);
          case 1:
            return resolve({ key: 1, value: v });
          default:
            return resolve(0);
        }
      });
    });
    expect(promise).to.be.a("promise");
    return promise.then((res) => expect(res).to.deep.equal([7, 2, 0]));
  });

  it("complex async", () => {
    const test = {
      a: { value: 1 },
      b: { value: 2 },
      c: { value: 3 },
    };
    const expected = {
      a: { value: 7 },
      x: { value: 2 },
      c: { value: 3 },
    };
    const promise = aokmap(test, (v, k) => {
      switch (k) {
        case "a":
          return Promise.resolve({ value: 7 });
        case "b":
          return new Promise((resolve) => {
            setTimeout(() => resolve({ key: "x", value: { value: 2 } }), 10);
          });
        default:
          return v;
      }
    });
    expect(promise).to.be.a("promise");
    return promise.then((res) => expect(res).to.deep.equal(expected));
  });
});
