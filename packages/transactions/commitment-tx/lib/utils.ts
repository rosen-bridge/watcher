/**
 * converts bigint to Uint8Array
 *
 * @param {bigint} num
 * @return {Uint8Array}
 */
export const bigIntToUint8Array = (num: bigint): Uint8Array => {
  const b = new ArrayBuffer(8);
  new DataView(b).setBigUint64(0, num);
  return new Uint8Array(b);
};
