import { map } from './containers';
export const startsWith = (string, s) => {
    return string.slice(0, s.length) === s;
};
export const beginsWith = (string, s) => {
    return string.slice(0, s.length) === s;
};
export const endsWith = (string, s) => {
    return s === string.slice(-s.length);
};
export const replaceAll = (str, find, rep) => {
    const escaped = find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return str.replace(new RegExp(escaped, 'g'), rep);
};
export const trim = (str) => {
    let ret = str;
    while (ret.length && ret[ret.length - 1] == ' ') {
        ret = ret.slice(0, ret.length - 1);
    }
    while (ret.length && ret[0] == ' ') {
        ret = ret.slice(1, ret.length);
    }
    return ret;
};
const toCamelDefaults = {};
export const toCamel = (input, options) => {
    const { delimiter, upperCase } = Object.assign(Object.assign({}, toCamelDefaults), options);
    const res = map(input.split(delimiter || " "), (word) => {
        return word.charAt(0).toUpperCase() + word.slice(1);
    }).join('');
    if (upperCase)
        return res;
    return res.charAt(0).toLowerCase() + res.slice(1);
};
const fromCamelDefaults = {
    upperCase: true
};
export const fromCamel = (input, options) => {
    const { delimiter, upperCase, capitalize, capsLock } = Object.assign(Object.assign({}, fromCamelDefaults), options);
    var words = input.match(/[A-Za-z][a-z]*/g);
    var out = words;
    out = out.map((word) => {
        const firstLetter = word.charAt(0);
        return (capitalize || capsLock ? firstLetter.toUpperCase() : firstLetter.toLowerCase()) + (capsLock ? word.substring(1).toUpperCase() : word.substring(1));
    });
    const joined = out.join(delimiter || " ");
    if (upperCase) {
        return joined.charAt(0)
            .toUpperCase() + joined.substring(1);
    }
    return joined;
};
//# sourceMappingURL=string.js.map