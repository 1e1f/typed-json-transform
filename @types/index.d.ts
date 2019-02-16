/// <reference types="mongodb" />

/// <reference path="./merge.d.ts" />

interface SIO { [index: string]: any }

declare namespace TJT {
  class OLHV<T> {
    require?: string;
    value: T
  }
  class OLHM<T> {
    [index: string]: OLHV<T>;
  }

  namespace OLHM {
    function parse(object: any): OLHM<any>;
    function safe<T>(olhm: OLHM<T>): T[];
  }

  namespace OLHV {
    function is(obj: any): boolean;
    function safe<T>(objOrVal: OLHV<T> | T): T;
  }

  interface Object { [x: string]: any }

  namespace Keypath {
    interface Options extends SIO {
      allLevels?: boolean;
      diffArrays?: boolean;
    }
  }

  interface ComparisonOptions {
    [index: string]: boolean;
    strict: boolean;
  }
}