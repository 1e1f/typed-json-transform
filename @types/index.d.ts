/// <reference path="./merge.d.ts" />

declare namespace TJT {
  interface SIO { [index: string]: any }

  interface CamelOptions {
    delimiter?: string
    upperCase?: boolean
    capsLock?: boolean
    capitalize: boolean
  }

  type Iterable<T> = { [index: string]: T } | Map<string | number, T> | T[]
  type MapLike<T> = { [index: string]: T } | Map<string | number, T>

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
  interface Options extends TJT.SIO {
    allLevels?: boolean;
    diffArrays?: boolean;
  }
}

declare namespace Mongo {
  interface Document extends TJT.SIO {
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