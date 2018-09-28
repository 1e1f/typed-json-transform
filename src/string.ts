import { map } from './containers';

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
  while (ret.length && ret[ret.length - 1] == ' ') {
    ret = ret.slice(0, ret.length - 1);
  }
  while (ret.length && ret[0] == ' ') {
    ret = ret.slice(1, ret.length);
  }
  return ret;
}

interface CamelOptions {
  delimiter?: string
  upperCase?: boolean
  capitalize?: boolean
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
  const { delimiter, upperCase, capitalize, capsLock } = { ...fromCamelDefaults, ...options };
  var words = input.match(/[A-Za-z][a-z]*/g);
  var out = words;

  out = out.map((word) => {
    const firstLetter = word.charAt(0);
    return (capitalize || capsLock ? firstLetter.toUpperCase() : firstLetter.toLowerCase()) + (capsLock ? word.substring(1).toUpperCase() : word.substring(1))
  });

  const joined = out.join(delimiter || " ");
  if (upperCase) {
    return joined.charAt(0)
      .toUpperCase() + joined.substring(1);
  }
  return joined
};
