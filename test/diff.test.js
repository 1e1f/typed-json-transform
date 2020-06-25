import { assert } from "chai";
import { check, modifierToObj, diffToModifier, apply } from "../esm";
import { makeA, makeB, makeC, makeD, makeZ, makeZp } from "./fixtures";
import { ObjectId } from "mongodb";

const dates = {
  sampleDate: new Date(),
  createdAt: new Date(),
  modifiedAt: new Date(),
};

const createdBy = new ObjectId();
const createdByB = new ObjectId(createdBy.toHexString());

const complexObjects = {
  a: {
    header: {
      productName: "Skunk 2.0s",
      sampleDate: dates.sampleDate,
      batchId: "1",
      laboratoryId: "1",
      licenseNumber: "1",
    },
    results: {
      potency: [
        {
          cannabinoid: "CBD",
          weight: 1,
        },
        {
          cannabinoid: "THCA",
          weight: 0.8,
        },
      ],
    },
    descriptors: {
      effects: [
        {
          name: "happy",
          value: 10,
        },
      ],
      taste: [
        {
          name: "sick",
          value: 2,
        },
      ],
    },
    _id: "5bbd90d7b4b98e135023ae49",
    strainId: "5b99625e0039e677e00173bb",
    createdBy,
    createdAt: dates.createdAt,
    modifiedAt: dates.modifiedAt,
    __v: 0,
  },
  b: {
    header: {
      productName: "Skunk 2.0",
      sampleDate: dates.sampleDate,
      batchId: "1",
      laboratoryId: "1",
      licenseNumber: "1",
    },
    results: {
      potency: [
        {
          cannabinoid: "CBD",
          weight: 1,
        },
        {
          cannabinoid: "THCA",
          weight: 0.8,
        },
      ],
    },
    descriptors: {
      effects: [
        {
          name: "happy",
          value: 10,
        },
      ],
      taste: [
        {
          name: "sick",
          value: 2,
        },
      ],
    },
    _id: "5bbd90d7b4b98e135023ae49",
    strainId: "5b99625e0039e677e00173bb",
    createdBy: createdByB,
    createdAt: dates.createdAt,
    modifiedAt: dates.modifiedAt,
    __v: 0,
  },
};

describe("diff", () => {
  it("diffToModifier", () => {
    const modifier = diffToModifier(complexObjects.a, complexObjects.b);
    assert.deepEqual(modifier, {
      $set: {
        "header.productName": "Skunk 2.0",
      },
    });
  });

  it("modifierToObj", () => {
    const modifier = {};
    modifier.$set = {
      "array.4": "5th element",
    };
    modifier.$unset = {
      emptyObject: undefined,
    };
    const obj = modifierToObj(modifier);
    assert.equal(obj.array[4], "5th element");
    assert.equal(obj.emptyObject, undefined);
  });

  it("modifier", () => {
    const date = new Date();
    const otherDate = new Date(date.valueOf() + 1000);
    const testObj = makeZ(date);
    const modifier = diffToModifier(testObj, makeZp(otherDate));
    assert.deepEqual(testObj, makeZ(date));
    assert.deepEqual(modifier, {
      $set: {
        "a.b.c": "string",
        d: otherDate,
        z: [
          7,
          7,
          {
            eight: 8,
          },
        ],
      },
      $unset: {
        0: true,
        e: true,
        m: true,
      },
    });
  });

  it("apply", () => {
    const testObj = makeA();
    const modifier = diffToModifier(testObj, makeB());
    apply(testObj, modifier);
    assert.deepEqual(testObj, makeB());
  });

  return it("apply (complex)", () => {
    const messA = {
      string: "alpha",
      nestedA: {
        array: [
          1,
          2,
          3,
          {
            nO1: "v1",
            nA: [0, 1, 2],
          },
          [3, 2, 1],
        ],
        nestedB: {
          string: "beta",
          array: [
            3,
            2,
            {
              nO1: "v2",
              nA: [0, 2],
            },
            {
              anotherKey: true,
            },
            [
              1,
              2,
              [
                1,
                {
                  two: 2,
                },
              ],
            ],
          ],
        },
      },
    };
    const messB = {
      nestedA: {
        array: [
          3,
          2,
          {
            nO1: "v2",
            nA: [0, 2],
          },
          {
            anotherKey: true,
          },
          [
            1,
            2,
            [
              1,
              {
                two: 2,
              },
            ],
          ],
        ],
        nestedB: {
          array: [
            1,
            2,
            3,
            {
              nO1: "v1",
              nA: [0, 1, 2],
            },
            [3, 2, 1],
          ],
          string: "it's a delta",
        },
      },
    };

    const modifier = diffToModifier(messA, messB);
    apply(messA, modifier);
    assert.deepEqual(
      messA,
      messB,
      `failed with modifier ${JSON.stringify(modifier, [], 2)}`
    );
  });
});
