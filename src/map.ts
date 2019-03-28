import { each } from './containers';

export const mapToObject = <T>(input: Map<string, T>): { [x: string]: T } => {
  const out: any = {};
  each(input, (value: any, key: string) => {
    if (typeof value == 'object') {
      out[key] = mapToObject(value)
    }
    else {
      out[key] = value
    }
  });
  return out
}