declare module 'typed-json-transform' {
  /* 
  * Container Methods
  */
  
  interface SIO { [index: string]: any }
  function each<T>(iter: { [index: string]: T } | T[], fn: (val: T, index?: string | number, breakLoop?: () => void) => void): void;
  function extend(target: SIO, ...sources: SIO[]);
  function combine(...args: Object[]);
  function any(iterable: Array<any>, fn: Function);
  function every<T>(iterable: any[], fn: Function);
  function map<T>(iter: { [index: string]: T } | T[], fn: (val: any, index: any) => any): T[];
  function reduce<T, S>(input: Array<T> | { [index: string]: T }, fn: (input: T, memo: S) => S, base?: S): S;
  function sum<T>(input: { [index: string]: T } | Array<T>, fn: (input: T) => number): number;
  function greatestResult<T>(input: { [index: string]: T } | Array<T>, fn: (input: T) => number): number;
  function sumIfEvery<T>(input: { [index: string]: T } | Array<T>, fn: (input: T) => number): number;
  function geoSum<T>(input: { [index: string]: T } | Array<T>, fn: (input: T, memo: number) => number): number;
  function union(...args: any[][]);
  function intersect<T>(...args: any[][]);
  function difference<T>(a: any[], b: any[]);
  function contains<T>(set: any[], match: T);
  function containsAny<T>(set: any[], match: any[]);
  function containsAll<T>(set: any[], match: any[]);
  function isEqual(actual: any, expected: any, opts?: any);
  function prune(obj: SIO);
  function plain(obj: any);
  function clone(input: any);
  function arrayify<T>(val: T | T[]): T[];
  function isEmpty(input: SIO);
  function okmap(iterable: Object | Array<any>, fn: Function);
  function stringify(value: any, replacer?: (number | string));

  /*
  * Keypath
  */

  function setValueForKeyPath(value: any, keyPath: string, input: SIO);
  function mergeValueAtKeypath(value: any, keyPath: string, obj: SIO);
  function valueForKeyPath(keyPath: string, input: SIO);
  function unsetKeyPath(keyPath: string, obj: SIO);
  function keyPathContainsPath(keyPath: string, ignorePath: string);
  function filteredKeyPaths(_keyPaths: string[], ignore?: string[]);
  interface keyPathOptions extends SIO {
    allLevels?: boolean;
    diffArrays?: boolean;
  }
  function keyPaths(obj: SIO, _options?: keyPathOptions, _stack?: string[], parent?: string);
  function allKeyPaths(obj: SIO);
  interface FlatObjectOptions {
    includeBranches?: boolean;
  }
  function flatObject(object: SIO, options?: FlatObjectOptions);

  /*
  * Diff / Mongo Method
  */

  interface keyPathOptions extends SIO {
    allLevels?: boolean;
    diffArrays?: boolean;
  }
  interface Modifier {
    $set?: SIO;
    $unset?: SIO;
  }
  interface Document extends SIO { _id: string; }
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
  function forwardDiffToModifier(prev: SIO, doc: SIO, fieldsToIgnore?: string[]);
  function shouldSet(val: any, prev: any);
  function shouldUnset(val: any, prev: any);
  function diffToModifier(prev: SIO, doc: SIO,
    fieldsToIgnore?: string[],
    pruneEmptyObjects?: boolean): Modifier;
  function modifierToObj(modifier: Modifier);
  function objToModifier(obj: SIO);
  function apply(dest: SIO, source: Modifier);
  function $set(dest: SIO, source: Modifier);
  function $addToSet(dest: Array<any>, src: Object);
  function $unset(dest: Object, source: Modifier);
  function update(doc: Document, options: UpdateOptions);
  function mapModifierToKey(modifier: Modifier, key: string);

  /*
  * Check
  */

  function check(value: any, type: any): boolean;

  /*
  * Cascade
  */

  function cascadeShallow(tree: any, keywords: string[], selectors: string[]);
  function cascade(tree: any, keywords: string[], selectors: string[]);
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
  function map<T>(olhm: OLHM<T>, fn: (v: any, k?: string) => T): T[];
  function okmap<T>(olhm: OLHM<T>, fn: (v: any, k?: string) => OLHV<T> | T): OLHM<T>;
  function parseOLHM(object: any): OLHM<any>;
  function safeOLHM<T>(olhm: OLHM<T>): T[];

}
