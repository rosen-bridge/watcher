
export function notEmpty<T>(value: T | null | undefined): value is T {
    return value !== null && value !== undefined;
}

export function toHexString(byteArray: Uint8Array) {
    return Array.from(byteArray, function(byte) {
        return ('0' + (byte & 0xFF).toString(16)).slice(-2);
    }).join('')
}

export function bigIntToUint8Array(num: bigint) {
    const b = new ArrayBuffer(8)
    new DataView(b).setBigUint64(0, num);
    return new Uint8Array(b);
}

export function applyMixins(derivedCtor: any, baseCtors: any[]) {
    baseCtors.forEach(baseCtor => {
        Object.getOwnPropertyNames(baseCtor.prototype).forEach(name => {
            if (name !== 'constructor') {
                derivedCtor.prototype[name] = baseCtor.prototype[name];
            }
        });
    });
}