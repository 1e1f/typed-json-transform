import { map } from './containers';
import { check } from './check';

export const startsWith = (string: string, s: string) => {
  return string.slice(0, s.length) === s;
}

export const beginsWith = (string: string, s: string) => {
  return string.slice(0, s.length) === s;
}

export const endsWith = (string: string, s: string) => {
  return s === string.slice(-s.length)
}

export const replaceAll = (str: string, find: string, rep: string) => {
  const escaped = find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return str.replace(new RegExp(escaped, 'g'), rep);
}

export const trim = (str: string) => {
  let ret = str;
  while (ret.length && ret.slice(-1) == ' ') {
    ret = ret.slice(0, ret.length - 1);
  }
  return ret;
}

interface CamelOptions {
  delimiter?: string
  upperCase?: boolean
  capsLock?: boolean
}

const toCamelDefaults: CamelOptions = {
};

export const toCamel = (input: string, options?: CamelOptions) => {
  const { delimiter, upperCase } = { ...toCamelDefaults, ...options };

  const res = map(input.split(delimiter || " "), (word: string) => {
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join('');
  if (upperCase) return res;
  return res.charAt(0).toLowerCase() + res.slice(1);
}

const fromCamelDefaults: CamelOptions = {
  upperCase: true
};

export const fromCamel = (input: string, options?: CamelOptions) => {
  const { delimiter, upperCase, capsLock } = { ...fromCamelDefaults, ...options };
  var words = input.match(/[A-Za-z][a-z]*/g);
  var out = words;

  out = out.map((word) => {
    const firstLetter = word.charAt(0);
    return (capsLock ? firstLetter.toUpperCase() : firstLetter.toLowerCase()) + word.substring(1);
  });

  const joined = out.join(delimiter || " ");
  if (upperCase) {
    return joined.charAt(0)
      .toUpperCase() + joined.substring(1);
  }
  return joined
};
