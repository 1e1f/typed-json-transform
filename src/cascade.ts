import { check } from './check';
import { every, sum, sumIfEvery, greatestResult, each, extend, any, contains } from './containers';
import { valueForKeyPath, mergeValueAtKeypath, keyPaths, unsetKeyPath } from './keypath';
import { startsWith, replaceAll } from './string';

interface Level<T> {
  [index: string]: T
}

type Stack<T> = Level<T>[]

function deepSearch<T>(object: any, keywords: string[], selectors: string[], stack: Stack<T>) {
  each(keyPaths(object), (key) => {
    let filtered = key;
    const unfiltered = key.split('.');
    let level = 0;
    for (const k of unfiltered) {
      if (select(keywords, k)) {
        const precedence = select(selectors, k);
        if (precedence > 0) {
          filtered = filtered.replace(`${k}.`, '').replace(`.${k}`, '');
          level += precedence;
        } else {
          // console.log('remove non match', filtered)
          // unsetKeyPath(filtered, object);
          return;
        }
      }
    };
    if (!stack[level]) {
      stack[level] = {};
    }
    stack[level][filtered] = valueForKeyPath(key, object);
  });
  const flat = {};
  each(stack, (level, height) => {
    if (level) {
      each(level, (v: T, kp: string) => {
        mergeValueAtKeypath(v, kp, flat);
      });
    }
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

function match(selectors: string[], selectable: string) {
  if (startsWith(selectable, '!')) {
    return 1 * <any>!contains(selectors, selectable.slice(1));
  }
  return 1 * <any>contains(selectors, selectable);
}

function matchEvery(selectors: string[], cssString: string): number {
  if (cssString.indexOf(' ') !== -1) {
    const selectables = cssString.split(' ');
    return sumIfEvery(selectables, (selectable: string) => {
      return match(selectors, selectable);
    });
  }
  return match(selectors, cssString);
}

function matchCssString(selectors: string[], cssString: string): number {
  const selectables = replaceAll(cssString, ', ', ',');
  if (selectables.indexOf(',') !== -1) {
    return greatestResult(selectables.split(','), (subCssString: string) => {
      return matchEvery(selectors, subCssString);
    });
  }
  return matchEvery(selectors, selectables);
}

export function select(input: string[], cssString: string): number {
  return matchCssString(input, cssString);
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