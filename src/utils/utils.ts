export function notEmpty<T>(value: T | null | undefined): value is T {
    return value !== null && value !== undefined;
}

export const strToUint8Array = (str: string): Uint8Array => {
    return new Uint8Array(Buffer.from(str, "hex"))
}

export const uint8ArrayToHex = (buffer: Uint8Array): string => {
    return [...buffer].map(b => b.toString(16).padStart(2, "0")).join("");
}

