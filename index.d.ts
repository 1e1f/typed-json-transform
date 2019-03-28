/// <reference path="./@types/index.d.ts" />

declare namespace TypedJSONTransform {
  class Graph<T> {
    nodes: { [index: string]: T };
    
    addNode(node: string, data?: T): void;
    removeNode(node: string): void;
    hasNode(node: string): boolean;
    getNodeData(node: string): any;
    setNodeData(node: string, data?: T): void;
    addDependency(from: string, to: string): void;
    removeDependency(from: string, to: string): void;
    dependenciesOf(node: string, leavesOnly?: boolean): string[];
    dependantsOf(node: string, leavesOnly?: boolean): string[];
    overallOrder(leavesOnly?: boolean): string[];
  }
}

declare module 'typed-json-transform' {
  /*
  String
  */
  function startsWith(string: string, s: string): boolean
  function beginsWith(string: string, s: string): boolean
  function endsWith(string: string, s: string): boolean
  function replaceAll(str: string, find: string, rep: string): string
  function trim(str: string): string



  function toCamel(input: string, options?: TJT.CamelOptions): string
  function fromCamel(input: string, options?: TJT.CamelOptions): string
  /* 
  * Container Methods
  */

  function set<T>(t: T & TJT.MapLike<any>, [k, v]: any[]): void
  function unset<T>(t: T & TJT.MapLike<any>, k: string | number): void
  function get<T>(s: TJT.MapLike<T>, k: string | number): T
  function mapToObject<T>(input: Map<string, T>): { [x: string]: T } 
  
  function each<T>(iter: { [index: string]: T } | T[], fn: (val: T, index?: string | number, breakLoop?: () => void) => void): void
  function replace<A, B>(target: A & TJT.SIO, source: B & TJT.SIO): A & B
  function extend<A, B>(target: A & TJT.SIO, source: B & TJT.SIO): A & B
  function extendOwn<A, B>(target: A & TJT.SIO, source: B & TJT.SIO): A & B
  function existentialExtend<A, B>(target: A & TJT.SIO, source: B & TJT.SIO): A & B
  function extendN<T>(target: T & TJT.SIO, ...sources: Array<TJT.SIO>): T
  function flatten<A>(arr: A[][]): A[]
  function assign<A, B>(a: A, b: B): A & B
  function combine<A, B>(a: A, b: B): A & B
  function combineN<T>(retType: T, ...args: TJT.SIO[]): T


  function mergeArray<StateShape>(returnValue: Merge.ReturnValue<StateShape>, setter: any): Merge.ReturnValue<StateShape>
  function mergeObject<StateShape>(returnValue: Merge.ReturnValue<StateShape>, setter: any): Merge.ReturnValue<StateShape>
  function mergeOrReturnAssignment<StateShape>(returnValue: Merge.ReturnValue<StateShape>, setter: any): Merge.ReturnValue<StateShape>
  function merge<T>(target: any, setter: any, state?: Merge.State): T
  function mergeN<T>(target: T & { [index: string]: any }, ...args: any[]): T
  function or<A, B>(a: A, b: B): A & B
  function any<T>(iter: { [index: string]: T } | T[], fn: (val: T, index?: string | number) => boolean): boolean
  function every<T>(iter: { [index: string]: T } | T[], fn: (val: T, index?: string | number) => boolean): boolean
  function all<T>(iter: { [index: string]: T } | T[], fn: (val: T, index?: string | number) => boolean): boolean
  function map<R, I>(iter: { [index: string]: I } | I[], fn: (val: I, index: any) => R): R[]
  function amap<R, I>(iter: { [index: string]: I } | I[], fn: (val: I, index: any) => R | Promise<R>): Promise<R[]>
  function keysAndValues<T>(object: { [index: string]: T }): { keys: string[], values: T[] }
  function reduce<T, S>(input: Array<T>, fn: (input: T, memo: S) => S, base?: S): S
  function reduce<T, S>(input: { [index: string]: T }, fn: (input: T, memo: S) => S, base?: S): S
  function sum<T>(input: { [index: string]: T } | Array<T>, fn: (input: T) => number): number
  function greatestResult<T>(input: { [index: string]: T } | Array<T>, fn: (input: T) => number): number
  function sumIfEvery<T>(input: { [index: string]: T } | Array<T>, fn: (input: T) => number): number
  function geoSum<T>(input: { [index: string]: T } | Array<T>, fn: (input: T, memo: number) => number): number
  function union<T>(...args: T[][]): T[]
  function concat<T>(...args: T[][]): T[]
  function intersect<T>(...args: T[][]): T[]
  function difference<T>(a: T[], b: T[]): T[]
  function contains<T>(set: any[], match: T): number
  function containsAny<T>(set: any[], match: any[]): number
  function containsAll<T>(set: any[], match: any[]): boolean
  function isEqual(actual: any, expected: any, opts?: TJT.ComparisonOptions): boolean
  function prune<T>(obj: T): T
  function clean<T>(obj: T): T
  function plain<T>(obj: T): T
  function clone<T>(input: T): T
  function arrayify<T>(val: T | T[]): T[]
  function okmap<R, I, IObject extends { [index: string]: I }, RObject extends { [index: string]: R }>(iterable: IObject | Array<I>, fn: (v: I, k?: string | number) => R): RObject
  function aokmap<R, I, IObject extends { [index: string]: I }>(iterable: IObject | Array<I>, fn: (v: I, k?: string | number) => R | Promise<R>): any
  function stringify(value: any, replacer?: (number | string)[], space?: string | number): string

  /*
  * Keypath
  */

  function setValueForKeyPath(value: any, keyPath: string, input: TJT.SIO): void
  function mergeValueAtKeypath(value: any, keyPath: string, obj: TJT.SIO): void
  function valueForKeyPath(keyPath: string, input: TJT.SIO): any
  function unsetKeyPath(keyPath: string, obj: TJT.SIO): boolean
  function keyPathContainsPath(keyPath: string, ignorePath: string): boolean
  function lastKey(kp: string): string
  function filteredKeyPaths(_keyPaths: string[], ignore?: string[]): string[]
  function keyPaths(obj: TJT.SIO, _options?: Keypath.Options, _stack?: string[], parent?: string): string[]
  function allKeyPaths(obj: TJT.SIO): string[]
  function flatObject(object: any, options?: Keypath.Options): TJT.SIO
  function unflatten(source: any): TJT.SIO
  /*
  * Diff / Mongo Method
  */

  function forwardDiffToModifier(prev: TJT.SIO, doc: TJT.SIO, fieldsToIgnore?: string[]): TJT.Modifier
  function shouldSet(val: any, prev: any): boolean
  function shouldUnset(val: any, prev: any): boolean
  function diffToModifier(prev: TJT.SIO, doc: TJT.SIO, fieldsToIgnore?: string[], pruneEmptyObjects?: boolean): TJT.Modifier
  function modifierToObj(modifier: TJT.Modifier): TJT.SIO
  function objToModifier(obj: TJT.SIO): TJT.Modifier
  function apply<T>(dest: T, source: TJT.Modifier): T
  function $set(dest: TJT.SIO, source: TJT.Modifier): void
  function $addToSet<T>(dest: T[], src: T): T[]
  function $unset(dest: Object, source: TJT.Modifier): void
  function update(doc: Mongo.Document, options: Mongo.UpdateOptions): TJT.Modifier
  function mapModifierToKey(modifier: TJT.Modifier, key: string): TJT.Modifier

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

  class Graph<T> extends TypedJSONTransform.Graph<T> {
    
  }
}