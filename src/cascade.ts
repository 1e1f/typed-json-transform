import { check } from './check';
import { combine, every, sum, sumIfEvery, greatestResult, each, or, any, contains, okmap } from './containers';
import { valueForKeyPath, mergeValueAtKeypath, keyPaths, unsetKeyPath } from './keypath';
import { startsWith, replaceAll } from './string';

function deepSearch(object: any, keywords: string[], selectors: string[]) {
  if (!object) return;
  if (!Object.keys(object).length) return object;
  const stack: Level[] = [];
  const failed = {};
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
          return;
        }
      }
    };
    if (!stack[level]) {
      stack[level] = {};
    }
    stack[level][filtered] = valueForKeyPath(key, object);
  });
  return stack;
}

function flatten(stack: Level[], fn?: Function) {
  const flat = {};
  const apply = fn || mergeValueAtKeypath;
  each(stack, (level, height) => {
    if (level) {
      each(level, (v: any, kp: string) => {
        apply(v, kp, flat);
      });
    }
  });
  return flat;
}

interface Level {
  [index: string]: any;
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

// export function allKeywords(object: any) {
//   const ret = <any>{};
//   each(keyPaths(object), (key) => {
//     let filtered = key;
//     key.split('.').forEach((v) => ret[v] = false);
//   });
//   return ret;
// }

export function extractKeywordsAndSelectors(options: { [index: string]: boolean }): { keywords: string[], selectors: string[] } {
  const keywords: string[] = [];
  const selectors: string[] = [];
  each(options, (opt, key: string) => {
    keywords.push(key);
    if (opt) selectors.push(key);
  });
  return {
    keywords, selectors
  }
}

export function hashField(trie: any, options: any) {
  const { keywords, selectors } = extractKeywordsAndSelectors(options);
  const match = flatten(deepSearch(trie, keywords, selectors));
  const unselected = okmap(trie, (val: any) => {
    return false;
  });
  const selected = okmap(match, (val: any) => {
    return !!val;
  });
  return or(unselected, selected);
}

export function cascade(tree: any, keywords: string[], selectors: string[], apply?: Function) {
  return flatten(deepSearch(tree, keywords, selectors), apply);
}
