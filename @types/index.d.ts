/// <reference path="./merge.d.ts" />

interface SIO { [index: string]: any }

interface CamelOptions {
  delimiter?: string
  upperCase?: boolean
  capsLock?: boolean
  capitalize: boolean
}

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

  interface Modifier {
    $set?: SIO;
    $unset?: SIO;
  }


  interface ComparisonOptions {
    [index: string]: boolean;
    strict: boolean;
  }
}

declare namespace Keypath {
  interface Options extends SIO {
    allLevels?: boolean;
    diffArrays?: boolean;
  }
}

declare namespace Mongo {
  interface Document extends SIO {
    _id: string;
  }

  interface Collection<T> {
    findOne<T>(): any;
    find<T>(): any;
    update<T>(): any;
  }

  interface UpdateOptions {
    collection?: Collection<any>;
    get?: Function;
    set?: Function;
    ignore?: string[];
  }
}