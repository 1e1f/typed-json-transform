function makeA() {
  return { a: "b", c: "z" };
}

function makeB() {
  return { c: "d", e: "f" };
}

function makeC() {
  return {
    a: {
      b: {},
    },
  };
}

function makeD() {
  return {
    a: {
      b: {
        c: 0,
      },
    },
  };
}

function makeZ(date) {
  const m = new Map();
  m.set("x", "string");
  m.set(1, { string: "a" });
  return {
    0: "arrayLikeThing",
    a: {
      b: {
        c: 0,
      },
    },
    d: date,
    e: date,
    m,
    z: [
      7,
      7,
      {
        seven: 7,
      },
    ],
  };
}

function makeZp(date) {
  return {
    a: {
      b: {
        c: "string",
      },
    },
    d: date,
    z: [
      7,
      7,
      {
        eight: 8,
      },
    ],
  };
}

export { makeA, makeB, makeC, makeD, makeZ, makeZp };
