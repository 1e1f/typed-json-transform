declare module 'js-object-tools' {
  function check(value: any, type: any): boolean;

  namespace diff {
  interface StringIndexableObject { [index: string]: any }

  function isEmpty(input: StringIndexableObject): boolean;
  function prune(obj: StringIndexableObject): void;

  function setValueForKeyPath(value: string, keyPath: string,
                              input: StringIndexableObject): void;
  function mergeValueAtKeypath(value: string, keyPath: string,
                               obj: StringIndexableObject): void;
  function extend(target: StringIndexableObject,
                  ... sources: StringIndexableObject[]): StringIndexableObject;
  function valueForKeyPath(keyPath: string, input: StringIndexableObject): any;
  function unsetKeyPath(keyPath: string, obj: StringIndexableObject): void;
  function keyPathContainsPath(keyPath: string, ignorePath: string): boolean;
  function filteredKeyPaths(_keyPaths: string[], ignore?: string[]): string[];
  interface keyPathOptions extends StringIndexableObject {
    allLevels?: boolean;
    diffArrays?: boolean;
  }
  function keyPaths(obj: StringIndexableObject, _options?: keyPathOptions,
                    _stack?: string[], parent?: string): string[];
  function allKeyPaths(obj: StringIndexableObject): string[];

  function forwardDiffToModifier(prev: StringIndexableObject,
                                 doc: StringIndexableObject,
                                 fieldsToIgnore?: string[]): Modifier;
  interface Modifier {
    $set?: StringIndexableObject;
    $unset?: StringIndexableObject;
  }
  function diffToModifier(prev: StringIndexableObject,
                          doc: StringIndexableObject, fieldsToIgnore?: string[],
                          pruneEmptyObjects?: boolean): Modifier;
  interface FlatObjectOptions { includeBranches?: boolean; }
  function flatObject(object: StringIndexableObject,
                      options?: FlatObjectOptions): StringIndexableObject;
  function groupReduce<T>(objOrArray: T, groupField: string,
                          reduceFunction: Function, baseType?: T): T;

  function okmap(iterable: Object | Array<any>,
                 fn: Function): StringIndexableObject;
  function modifierToObj(modifier: Modifier): StringIndexableObject;

  function objToModifier(obj: StringIndexableObject): Modifier;
  function apply(dest: StringIndexableObject,
                 source: Modifier): StringIndexableObject;

  function $set(dest: StringIndexableObject, source: Modifier): void;

  function combine(... args: Object[]): StringIndexableObject;

  function any(iterable: Array<any>, fn: Function): boolean;
  function every(iterable: Array<any>, fn: Function): boolean;

  function contains<T>(set: Array<T>, match: T): boolean;

  function containsAny<T>(set: Array<T>, match: Array<T>): boolean;

  function containsAll<T>(set: Array<T>, match: Array<T>): boolean;

  function $addToSet(dest: Array<any>, src: Object): void;
  function $unset(dest: Object, source: Modifier): void;

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

  function update(doc: Document, options: UpdateOptions): void;

  function clone<T>(input: T): T;

  function mapModifierToKey(modifier: Modifier, key: string): Modifier;
  function stringify(value: any, replacer?: (number | string)[],
                     space?: string | number): string;
  function plain(obj: any): StringIndexableObject;
  function arrayify(val: any): Array<any>;
  }
}
