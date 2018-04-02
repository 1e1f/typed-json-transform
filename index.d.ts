declare module 'typed-json-transform' {
  /*
  String
  */
  function startsWith(string: string, s: string): boolean
  function beginsWith(string: string, s: string): boolean
  function endsWith(string: string, s: string): boolean
  function replaceAll(str: string, find: string, rep: string): string
  function trim(str: string): string

  interface CamelOptions {
    delimiter?: string
    upperCase?: boolean
    capsLock?: boolean
  }

  function toCamel(input: string, options?: CamelOptions): string
  function fromCamel(input: string, options?: CamelOptions): string
  /* 
  * Container Methods
  */
  interface ComparisonOptions {
    [index: string]: boolean;
    strict: boolean;
  }


  interface SIO { [index: string]: any }

  export function each<T>(iter: { [index: string]: T } | T[], fn: (val: T, index?: string | number, breakLoop?: () => void) => void): void
  export function replace<A, B>(target: A & SIO, source: B & SIO): A & B
  export function extend<A, B>(target: A & SIO, source: B & SIO): A & B
  export function extendOwn<A, B>(target: A & SIO, source: B & SIO): A & B
  export function existentialExtend<A, B>(target: A & SIO, source: B & SIO): A & B
  export function extendN<T>(target: T & SIO, ...sources: Array<SIO>): T
  export function flatten<A>(arr: A[][]): A[]
  export function assign<A, B>(a: A, b: B): A & B
  export function combine<A, B>(a: A, b: B): A & B
  export function combineN<T>(retType: T, ...args: SIO[]): T

  type MergeMethod = '!' | '&' | '!' | '=' | '?' | '+' | '|' | '-' | '^';

  interface MergeOptions {
    arrayMergeMethod?: MergeMethod
    objectMergeMethod?: MergeMethod
  }

  export function merge<T>(target: T & { [index: string]: any }, setter: any, options?: MergeOptions): T
  export function mergeN<T>(target: T & { [index: string]: any }, ...args: any[]): T
  export function or<A, B>(a: A, b: B): A & B
  export function any<T>(iter: { [index: string]: T } | T[], fn: (val: T, index?: string | number) => boolean): boolean
  export function every<T>(iter: { [index: string]: T } | T[], fn: (val: T, index?: string | number) => boolean): boolean
  export function all<T>(iter: { [index: string]: T } | T[], fn: (val: T, index?: string | number) => boolean): boolean
  export function map<R, I>(iter: { [index: string]: I } | I[], fn: (val: I, index: any) => R): R[]
  export function reduce<T, S>(input: Array<T>, fn: (input: T, memo: S) => S, base?: S): S
  export function reduce<T, S>(input: { [index: string]: T }, fn: (input: T, memo: S) => S, base?: S): S
  export function sum<T>(input: { [index: string]: T } | Array<T>, fn: (input: T) => number): number
  export function greatestResult<T>(input: { [index: string]: T } | Array<T>, fn: (input: T) => number): number
  export function sumIfEvery<T>(input: { [index: string]: T } | Array<T>, fn: (input: T) => number): number
  export function geoSum<T>(input: { [index: string]: T } | Array<T>, fn: (input: T, memo: number) => number): number
  export function union<T>(...args: T[][]): T[]
  export function concat<T>(...args: T[][]): T[]
  export function intersect<T>(...args: T[][]): T[]
  export function difference<T>(a: T[], b: T[]): T[]
  export function contains<T>(set: any[], match: T): boolean
  export function containsAny<T>(set: any[], match: any[]): boolean
  export function containsAll<T>(set: any[], match: any[]): boolean
  export function isEqual(actual: any, expected: any, opts?: ComparisonOptions): boolean
  export function prune<T>(obj: T): T
  export function clean<T>(obj: T): T
  export function plain<T>(obj: T): T
  export function clone<T>(input: T): T
  export function arrayify<T>(val: T | T[]): T[]
  export function okmap<R, I, IObject extends { [index: string]: I }, RObject extends { [index: string]: R }>(iterable: IObject | Array<I>, fn: (v: I, k?: string | number) => R): RObject;
  export function stringify(value: any, replacer?: (number | string)[], space?: string | number): string

  /*
  * Keypath
  */
  namespace Keypath {
    interface Options extends SIO {
      allLevels?: boolean;
      diffArrays?: boolean;
    }
  }

  function setValueForKeyPath(value: any, keyPath: string, input: SIO): void
  function mergeValueAtKeypath(value: any, keyPath: string, obj: SIO): void
  function valueForKeyPath(keyPath: string, input: SIO): any
  function unsetKeyPath(keyPath: string, obj: SIO): boolean
  function keyPathContainsPath(keyPath: string, ignorePath: string): boolean
  function filteredKeyPaths(_keyPaths: string[], ignore?: string[]): string[]
  function keyPaths(obj: SIO, _options?: Keypath.Options, _stack?: string[], parent?: string): string[]
  function allKeyPaths(obj: SIO): string[]
  function flatObject(object: any, options?: { includeBranches?: boolean }): SIO

  /*
  * Diff / Mongo Method
  */

  namespace Mongo {
    interface Document extends SIO {
      _id: string;
    }

    interface Collection {
      findOne: Function;
      find: Function;
      update: Function;
    }

    interface UpdateOptions {
      collection?: Collection;
      get?: Function;
      set?: Function;
      ignore?: string[];
    }

    interface Modifier {
      $set?: SIO;
      $unset?: SIO;
    }
  }

  function forwardDiffToModifier(prev: SIO, doc: SIO, fieldsToIgnore?: string[]): Mongo.Modifier
  function shouldSet(val: any, prev: any): boolean
  function shouldUnset(val: any, prev: any): boolean
  function diffToModifier(prev: SIO, doc: SIO, fieldsToIgnore?: string[], pruneEmptyObjects?: boolean): Mongo.Modifier
  function modifierToObj(modifier: Mongo.Modifier): SIO
  function objToModifier(obj: SIO): Mongo.Modifier
  function apply<T>(dest: T, source: Mongo.Modifier): T
  function $set(dest: SIO, source: Mongo.Modifier): void
  function $addToSet<T>(dest: T[], src: T): T[]
  function $unset(dest: Object, source: Mongo.Modifier): void
  function update(doc: Mongo.Document, options: Mongo.UpdateOptions): Mongo.Modifier
  function mapModifierToKey(modifier: Mongo.Modifier, key: string): Mongo.Modifier

  /*
  * Check
  */

  function check(value: any, type: any): boolean
  function isNumeric(n: any): boolean
  function isArguments(object: any): boolean
  function isEmpty(input: { [index: string]: string }): boolean
  function isUndefinedOrNull(value: any): boolean
  /*
  * Cascade
  */

  function extractKeywordsAndSelectors(options: { [index: string]: boolean }): { keywords: string[], selectors: string[] }
  function cascade(tree: any, keywords: string[], selectors: string[]): any
  function hashField(tree: any, keywords: string[], selectors: string[]): any
  function select(input: string[], cssString: string): boolean;

  /*
  Graph
  */

  class Graph<T> {
    [index: string]: any;

    addNode(node: string, data?: T): void;
    removeNode(node: string): void;
    hasNode(node: string): boolean;
    getNodeData(node: string): any;
    setNodeData(node: string, data?: T): void;
    addDependency(from: string, to: string): void;
    removeDependency(from: string, to: string): void;
    dependenciesOf(node: string, leavesOnly: boolean): any[];
    dependantsOf(node: string, leavesOnly: boolean): any[];
    overallOrder(leavesOnly: boolean): any[];
  }

  /*
  Optionally Linked Hash Maps
  */

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
}
