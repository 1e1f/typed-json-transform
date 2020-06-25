import { check } from './check';
import { unflatten } from './keypath';
import { arrayify, Mutate, contains } from './arrays';
const { concat, subtract, difference, intersect, union, xor, assign, compareAndFilter } = Mutate;
function _mergeArray(lhs, rhs, operator) {
    switch (operator) {
        case '=':
            assign(lhs, rhs);
            break;
        case '+':
            concat(lhs, rhs);
            break;
        case '-':
            subtract(lhs, rhs);
            break;
        case '!':
            difference(lhs, rhs);
            break;
        case '&':
            intersect(lhs, rhs);
            break;
        case '|':
            union(lhs, rhs);
            break;
        case '^':
            xor(lhs, rhs);
            break;
        case '?':
            compareAndFilter(lhs, rhs, (a, b) => a && b);
            break;
        case '*':
            compareAndFilter(lhs, rhs, (a, b) => b && a);
            break;
        default: throw new Error(`unhandled Array merge operator ${operator}`);
    }
}
export function mergeArray({ data: lhs, state }, rhs) {
    const { merge: { operator } } = state;
    if (check(rhs, Object)) {
        let mutated;
        for (const key of Object.keys(rhs)) {
            if ((key.length == 2) && (key[0] == '<')) {
                const nextState = Object.assign(Object.assign({}, state), { merge: {
                        operator: key[1]
                    } });
                mutated = true;
                mergeArray({ data: lhs, state: nextState }, rhs[key]).data;
            }
        }
        if (mutated) {
            return { data: undefined, state };
        }
    }
    else if (check(rhs, Array)) {
        recurArray({ data: null, state }, rhs);
        _mergeArray(lhs, rhs, operator);
        return { data: undefined, state };
    }
    switch (operator) {
        case '=': throw new Error('replacing array value with non-array value');
        default:
            _mergeArray(lhs, arrayify(rhs), operator);
            return { data: undefined, state };
    }
}
export function mergeObject(rv, _setter) {
    const { state, data } = rv;
    const { merge: { operator } } = state;
    const setter = unflatten(_setter);
    for (const key of Object.keys(setter)) {
        if ((key.length == 2) && (key[0] == '<')) {
            const nextState = Object.assign(Object.assign({}, state), { merge: {
                    operator: key[1]
                } });
            const assignment = mergeOrReturnAssignment({ data, state: nextState }, setter[key]).data;
            if (assignment || check(assignment, [Number])) {
                data[key] = assignment;
            }
        }
        else {
            let lhs = data[key];
            const rhs = setter[key];
            const doMerge = () => {
                const assignment = mergeOrReturnAssignment({ data: lhs, state }, rhs).data;
                if (assignment !== undefined) {
                    if (operator == '^') {
                        if (data[key] == assignment)
                            delete data[key];
                        else
                            data[key] = assignment;
                    }
                    else {
                        data[key] = assignment;
                    }
                }
            };
            switch (operator) {
                case '^':
                case '|':
                case '+':
                    doMerge();
                    break;
                case '=':
                    doMerge();
                    break;
                case '!':
                    if (lhs === undefined)
                        doMerge();
                    break;
                case '?':
                case '&':
                case '*':
                    if (lhs)
                        doMerge();
                    break;
                case '-':
                    if (rhs !== undefined)
                        delete data[key];
                    break;
                default: throw new Error(`unhandled merge operator ${operator}`);
            }
            if (check(data, Object)) {
                for (const key of Object.keys(data)) {
                    let rhs = setter[key];
                    switch (operator) {
                        case '=':
                            if (rhs === undefined)
                                delete data[key];
                            break;
                        case '&':
                        case '*':
                            if (!rhs)
                                delete data[key];
                            break;
                        default: break;
                    }
                }
            }
        }
    }
    return { data, state };
}
const printType = (val) => {
    if (check(val, Object)) {
        return 'object';
    }
    return val;
};
function throwIfImplicitConversion(rv, rhs) {
    const { data: lhs, state } = rv;
    const { operator } = state.merge;
    if ((lhs !== undefined) && (typeof lhs !== typeof rhs) && state.implicitTypeConversionError) {
        throw new Error(`implicit type change in ${printType(lhs)} ${operator} ${printType(rhs)}\n${JSON.stringify(rhs, null, 2)}`);
    }
}
export const recurArray = (rv, rhs) => {
    const { state } = rv;
    rhs.forEach((val, index) => {
        const res = mergeOrReturnAssignment({ data: undefined, state: Object.assign(Object.assign({}, state), { merge: { operator: '=' } }) }, val).data;
        if (res !== undefined) {
            rhs[index] = res;
        }
    });
};
export function mergeOrReturnAssignment(rv, rhs) {
    const { data: lhs, state } = rv;
    const { operator } = state.merge;
    if (check(lhs, Array)) {
        mergeArray(rv, rhs);
    }
    else if (check(lhs, Object)) {
        if (check(rhs, Object)) {
            mergeObject(rv, rhs);
        }
        else {
            if (contains(['&', '*', '-'], operator)) {
                switch (operator) {
                    case '*':
                    case '&': if (rhs === undefined)
                        return { data: 0, state };
                    case '-':
                        if (rhs && check(rhs, String))
                            delete lhs[rhs];
                        return { data: undefined, state };
                }
            }
            throwIfImplicitConversion(rv, rhs);
        }
    }
    else {
        if (check(rhs, Object)) {
            if (isMergeConstructor(rhs)) {
                const obj = construct(rv, rhs).data;
                return mergeOrReturnAssignment(rv, obj);
            }
            else {
                throwIfImplicitConversion(rv, rhs);
                let ret = { data: {}, state: Object.assign(Object.assign({}, state), { merge: { operator: '=' } }) };
                mergeOrReturnAssignment(ret, rhs);
                return ret;
            }
        }
        if (check(rhs, Array)) {
            throwIfImplicitConversion(rv, rhs);
            recurArray(rv, rhs);
        }
        return { data: rhs, state };
    }
    return { data: undefined, state };
}
export const isMergeConstructor = (val) => {
    for (const key of Object.keys(val)) {
        if ((key.length == 2) && (key[0] == '<')) {
            return true;
        }
    }
};
export function construct(rv, constructor) {
    let data;
    const { state } = rv;
    for (const key of Object.keys(constructor)) {
        if ((key.length == 2) && (key[0] == '<')) {
            const nextOperator = key[1];
            const res = mergeOrReturnAssignment({
                data, state: {
                    merge: Object.assign(Object.assign({}, state.merge), { operator: nextOperator })
                }
            }, constructor[key]).data;
            if (res || check(res, Number)) {
                data = res;
            }
        }
    }
    return { data, state };
}
//# sourceMappingURL=merge.js.map