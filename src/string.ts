import { map } from './containers';
import { check } from './check';

export function startsWith(string: string, s: string) {
  return string.slice(0, s.length) === s;
}

export function beginsWith(string: string, s: string) {
  return string.slice(0, s.length) === s;
}

export function endsWith(string: string, s: string) {
  return s === '' || string.slice(-s.length) === s;
}

export function replaceAll(str: string, find: string, rep: string) {
  const escaped = find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return str.replace(new RegExp(escaped, 'g'), rep);
}