import { sumIfEvery, greatestResult, each, or, contains, okmap } from './containers';
import { valueForKeyPath, mergeValueAtKeypath, keyPaths } from './keypath';
import { startsWith, replaceAll } from './string';

function deepSearch(object: any, keywords: string[], selectors: string[]) {
  if (!object) return;
  if (!Object.keys(object).length) return object;
  const stack: Level[] = [];
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


function matchSelector(selectors: string[], selectable: string) {
  if (startsWith(selectable, '!')) {
    return 1 * <any>!contains(selectors, selectable.slice(1));
  }
  return 1 * <any>contains(selectors, selectable);
}

function matchEvery(selectedList: string[], selectorString: string): number {
  if (selectorString.indexOf(' ') !== -1) {
    const selectables = selectorString.split(' ');
    return sumIfEvery(selectables, (selectable: string) => {
      return matchSelector(selectedList, selectable);
    });
  }
  return matchSelector(selectedList, selectorString);
}

function matchSelectorString(selectedList: string[], selectorString: string): number {
  const selectables = replaceAll(selectorString, ', ', ',');
  if (selectables.indexOf(',') !== -1) {
    return greatestResult(selectables.split(','), (subCssString: string) => {
      return matchEvery(selectedList, subCssString);
    });
  }
  return matchEvery(selectedList, selectables);
}

export function select(input: string[], cssString: string): number {
  return matchSelectorString(input, cssString);
}

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
