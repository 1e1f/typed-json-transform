import { check } from './check';
import { every, tally, each, extend, any, contains } from './containers';
import { valueForKeyPath, mergeValueAtKeypath, keyPaths } from './keypath';
import { startsWith, replaceAll } from './string';

interface MatchedSelection<T> {
  priority: number
  value: T
}

interface Level<T> {
  [index: string]: MatchedSelection<T>
}

type Stack<T> = Level<T>[]


function deepSearch(object: any, keywords: string[], selectors: string[], stack: Stack<any>) {
  for (const key of keyPaths(object)) {
    let filtered = key;
    const unfiltered = key.split('.');
    let height = 0;
    let matchingSelectorsAtLevel = 0;
    for (const kp of unfiltered) {
      if (select(keywords, kp)) {
        matchingSelectorsAtLevel = select(selectors, kp);
        if (matchingSelectorsAtLevel > 0) {
          height += 1;
          filtered = filtered.replace(`${kp}.`, '');
          filtered = filtered.replace(`.${kp}`, '');
        }
      }
    }
    if (matchingSelectorsAtLevel) {
      if (stack[height] == null) {
        stack[height] = {};
      }
      if (!stack[height][filtered] || (stack[height][filtered] && stack[height][filtered].priority <= matchingSelectorsAtLevel)) {
        const val = valueForKeyPath(key, object);
        stack[height][filtered] = {
          priority: matchingSelectorsAtLevel,
          value: val
        }
      }
    }
  }
  const flat = {};
  each(stack, (priority) => {
    each(priority, (v: MatchedSelection<any>, k: string) => { mergeValueAtKeypath(v.value, k, flat); });
  });
  return flat;
}

function shallowSearch(current: any, keywords: string[], selectors: string[], stack: any[], height?: number) {
  if (!check(stack[height], Object)) {
    stack[height] = {};
  }
  for (const key of Object.keys(current)) {
    if (select(keywords, key)) {
      if (select(selectors, key)) {
        shallowSearch(current[key], keywords, selectors, stack, height + 1);
      }
    } else {
      if (check(current[key], Object)) {
        stack[height][key] =
          flatten(shallowSearch(current[key], keywords, selectors, [], 0));
      } else {
        stack[height][key] = current[key];
      }
    }
  }
  return stack;
}

function flatten(stack: any) {
  const flat = {};
  for (const level of Object.keys(stack)) {
    extend(flat, stack[level]);
  }
  return flat;
}

function parseAnd(input: string[], cssString: string): number {
  if (cssString.indexOf(' ') !== -1) {
    return tally(cssString.split(' '), (subCssString: string) => {
      if (startsWith(subCssString, '!')) {
        if (!contains(input, subCssString)) {
          return 1;
        }
      } else {
        if (contains(input, subCssString)) {
          return 1;
        }
      }
    });
  }
  if (contains(input, cssString)) {
    return 1;
  }
}

function parseOr(input: string[], cssString: string): number {
  const repl = replaceAll(cssString, ', ', ',');
  if (repl.indexOf(',') !== -1) {
    return tally(repl.split(','), (subCssString: string) => {
      return parseAnd(input, subCssString);
    });
  }
  return parseAnd(input, repl);
}

export function select(input: string[], cssString: string): number {
  return parseOr(input, cssString);
}

function search(tree: any, keywords: string[], selectors: string[], searchFn: Function) {
  if (!tree) {
    throw new Error('searching undefined for selectors');
  }
  if (!keywords || !selectors) {
    console.warn('searching tree without keywords or selectors string');
  }
  return searchFn(tree, keywords, selectors, [], 0);
}

export function cascadeShallow(tree: any, keywords: string[], selectors: string[]) {
  return flatten(search(tree, keywords, selectors, shallowSearch));
}

export function cascade(tree: any, keywords: string[], selectors: string[]) {
  return search(tree, keywords, selectors, deepSearch);
}