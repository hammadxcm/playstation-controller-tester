const TABLE = new Uint32Array(256)
for (let n = 0; n < 256; n++) {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  TABLE[n] = c >>> 0
}

/** Standard CRC-32. Chainable: crc32(b, crc32(a)) === crc32(a ‖ b). */
export function crc32(data: ArrayLike<number>, crc = 0): number {
  let c = (crc ^ 0xffffffff) >>> 0
  for (let i = 0; i < data.length; i++) c = TABLE[(c ^ data[i]!) & 0xff]! ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

export const SEED = { input: 0xa1, output: 0xa2, feature: 0xa3 } as const

/** CRC over [seed, reportId, ...body] as Sony pads expect. */
export function sonyCrc(seed: number, reportId: number, body: ArrayLike<number>): number {
  return crc32(body, crc32([seed, reportId]))
}

export function writeCrcLE(buf: Uint8Array, offset: number, crc: number): void {
  buf[offset] = crc & 0xff
  buf[offset + 1] = (crc >>> 8) & 0xff
  buf[offset + 2] = (crc >>> 16) & 0xff
  buf[offset + 3] = (crc >>> 24) & 0xff
}
