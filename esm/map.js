import { each } from './containers';
export const mapToObject = (input) => {
    const out = {};
    each(input, (value, key) => {
        if (typeof value == 'object') {
            out[key] = mapToObject(value);
        }
        else {
            out[key] = value;
        }
    });
    return out;
};
//# sourceMappingURL=map.js.map