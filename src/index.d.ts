declare module 'js-object-tools' {
  interface StringIndexableObject { [index: string]: any }
  function check(value: any, type: any): boolean;

  /*
    * Container Methods
  */
  function stringify(value: any, replacer?: (number | string)[],
    space?: string | number): string;
  function plain(obj: any): StringIndexableObject;
  function arrayify(val: any): Array<any>;
  function clone<T>(input: T): T;
  function isEmpty(input: StringIndexableObject): boolean;
  function prune(obj: StringIndexableObject): void;
  function extend(target: StringIndexableObject,
    ...sources: StringIndexableObject[]): StringIndexableObject;
  function combine(...args: Object[]): StringIndexableObject;
  function any(iterable: Array<any>, fn: Function): boolean;
  function every(iterable: Array<any>, fn: Function): boolean;
  function contains<T>(set: Array<T>, match: T): boolean;
  function containsAny<T>(set: Array<T>, match: Array<T>): boolean;
  function containsAll<T>(set: Array<T>, match: Array<T>): boolean;

  interface FlatObjectOptions { includeBranches?: boolean; }
  function flatObject(object: StringIndexableObject,
    options?: FlatObjectOptions): StringIndexableObject;
  function groupReduce<T>(objOrArray: T, groupField: string,
    reduceFunction: Function, baseType?: T): T;
  function okmap(iterable: Object | Array<any>,
    fn: Function): StringIndexableObject;

  /*
    * Diff / Mongo Method
  */
  interface keyPathOptions extends StringIndexableObject {
    allLevels?: boolean;
    diffArrays?: boolean;
  }
  interface Modifier {
    $set?: StringIndexableObject;
    $unset?: StringIndexableObject;
  }
  interface Document extends StringIndexableObject { _id: string; }
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
  function setValueForKeyPath(value: string, keyPath: string,
    input: StringIndexableObject): void;
  function mergeValueAtKeypath(value: string, keyPath: string,
    obj: StringIndexableObject): void;
  function valueForKeyPath(keyPath: string, input: StringIndexableObject): any;
  function unsetKeyPath(keyPath: string, obj: StringIndexableObject): void;
  function keyPathContainsPath(keyPath: string, ignorePath: string): boolean;
  function filteredKeyPaths(_keyPaths: string[], ignore?: string[]): string[];
  function keyPaths(obj: StringIndexableObject, _options?: keyPathOptions,
    _stack?: string[], parent?: string): string[];
  function allKeyPaths(obj: StringIndexableObject): string[];
  function forwardDiffToModifier(prev: StringIndexableObject,
    doc: StringIndexableObject,
    fieldsToIgnore?: string[]): Modifier;
  function diffToModifier(prev: StringIndexableObject,
    doc: StringIndexableObject, fieldsToIgnore?: string[],
    pruneEmptyObjects?: boolean): Modifier;
  function modifierToObj(modifier: Modifier): StringIndexableObject;
  function objToModifier(obj: StringIndexableObject): Modifier;
  function apply(dest: StringIndexableObject,
    source: Modifier): StringIndexableObject;
  function $set(dest: StringIndexableObject, source: Modifier): void;
  function $addToSet(dest: Array<any>, src: Object): void;
  function $unset(dest: Object, source: Modifier): void;
  function update(doc: Document, options: UpdateOptions): void;
  function mapModifierToKey(modifier: Modifier, key: string): Modifier;

  class OLHV<T> {
    require?: string;
    value: T
  }
  class OLHM<T> {
    [index: string]: OLHV<T>;
  }
  function parseOLHM(object: any): OLHM<any>;
  function safeOLHM<T>(olhm: OLHM<T>): T[];

  /**
  * The following is a typescript re-implementation of DepGraph, originally authored by jriecken
  * original license and source code may be found @ https://github.com/jriecken/dependency-graph
  */

  class NodeGraph<T> {
    addNode(node: string, data?: T): void;
    /**
     * Remove a node from the dependency graph. If a node does not exist, this method will do nothing.
     */
    removeNode(node: string): void;
    /**
     * Check if a node exists in the graph
     */
    hasNode(node: string): boolean;
    /**
     * Get the data associated with a node name
     */
    getNodeData(node: string): any;
    /**
     * Set the associated data for a given node name. If the node does not exist, this method will throw an error
     */
    setNodeData(node: string, data?: T): void;
    /**
     * Add a dependency between two nodes. If either of the nodes does not exist,
     * an Error will be thrown.
     */
    addDependency(from: string, to: string): void;
    /**
     * Remove a dependency between two nodes.
     */
    removeDependency(from: string, to: string): void;
    /**
     * Get an array containing the nodes that the specified node depends on (transitively).
     *
     * Throws an Error if the graph has a cycle, or the specified node does not exist.
     *
     * If `leavesOnly` is true, only nodes that do not depend on any other nodes will be returned
     * in the array.
     */
    dependenciesOf(node: string, leavesOnly: boolean): any[];
    /**
     * get an array containing the nodes that depend on the specified node (transitively).
     *
     * Throws an Error if the graph has a cycle, or the specified node does not exist.
     *
     * If `leavesOnly` is true, only nodes that do not have any dependants will be returned in the array.
     */
    dependantsOf(node: string, leavesOnly: boolean): any[];
    /**
     * Construct the overall processing order for the dependency graph.
     *
     * Throws an Error if the graph has a cycle.
     *
     * If `leavesOnly` is true, only nodes that do not depend on any other nodes will be returned.
     */
    overallOrder(leavesOnly: boolean): any[];
  }
}
