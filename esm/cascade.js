import { contains } from './arrays';
import { sumIfEvery, greatestResult, each, or, okmap } from './containers';
import { valueForKeyPath, mergeValueAtKeypath, keyPaths } from './keypath';
import { startsWith, replaceAll } from './string';
function deepSearch(object, keywords, selectors) {
    if (!object)
        return;
    if (!Object.keys(object).length)
        return object;
    const stack = [];
    each(keyPaths(object), (key) => {
        let filtered = key;
        const unfiltered = (key === null || key === void 0 ? void 0 : key.split('.')) || [];
        let level = 0;
        for (const k of unfiltered) {
            if (select(keywords, k)) {
                const precedence = select(selectors, k);
                if (precedence > 0) {
                    filtered = filtered.replace(`${k}.`, '').replace(`.${k}`, '');
                    level += precedence;
                }
                else {
                    return;
                }
            }
        }
        ;
        if (!stack[level]) {
            stack[level] = {};
        }
        stack[level][filtered] = valueForKeyPath(key, object);
    });
    return stack;
}
function flatten(stack, fn) {
    const flat = {};
    const apply = fn || mergeValueAtKeypath;
    each(stack, (level, height) => {
        if (level) {
            each(level, (v, kp) => {
                apply(v, kp, flat);
            });
        }
    });
    return flat;
}
function matchSelector(selectors, selectable) {
    if (startsWith(selectable, '!')) {
        return 1 * !contains(selectors, selectable.slice(1));
    }
    return 1 * contains(selectors, selectable);
}
function matchEvery(selectedList, selectorString) {
    if (selectorString.indexOf(' ') !== -1) {
        const selectables = selectorString.split(' ');
        return sumIfEvery(selectables, (selectable) => {
            return matchSelector(selectedList, selectable);
        });
    }
    return matchSelector(selectedList, selectorString);
}
function matchSelectorString(selectedList, selectorString) {
    const selectables = replaceAll(selectorString, ', ', ',');
    if (selectables.indexOf(',') !== -1) {
        return greatestResult(selectables.split(','), (subCssString) => {
            return matchEvery(selectedList, subCssString);
        });
    }
    return matchEvery(selectedList, selectables);
}
export function select(input, cssString) {
    return matchSelectorString(input, cssString);
}
export function extractKeywordsAndSelectors(options) {
    const keywords = [];
    const selectors = [];
    each(options, (opt, key) => {
        keywords.push(key);
        if (opt)
            selectors.push(key);
    });
    return {
        keywords, selectors
    };
}
export function hashField(trie, options) {
    const { keywords, selectors } = extractKeywordsAndSelectors(options);
    const match = flatten(deepSearch(trie, keywords, selectors));
    const unselected = okmap(trie, (val) => {
        return false;
    });
    const selected = okmap(match, (val) => {
        return !!val;
    });
    return or(unselected, selected);
}
export function cascade(tree, keywords, selectors, apply) {
    return flatten(deepSearch(tree, keywords, selectors), apply);
}
//# sourceMappingURL=cascade.js.map