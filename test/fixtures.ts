function makeA() {
    return { a: 'b', c: 'z' };
}

function makeB() {
    return { c: 'd', e: 'f' };
}

function makeC() {
    return {
        a: {
            b: {}
        }
    };
}

function makeD() {
    return {
        a: {
            b: {
                c: 0
            }
        }
    };
}

function makeZ(date: Date) {
    return {
        0: 'arrayLikeThing',
        a: {
            b: {
                c: 0
            }
        },
        d: date,
        z: [
            7,
            7, {
                seven: 7
            }
        ]
    };
}

export {
    makeA, makeB, makeC, makeD, makeZ
}