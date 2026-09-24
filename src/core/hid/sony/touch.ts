export interface Touch {
  id: number
  active: boolean
  /** 0..1 */
  x: number
  y: number
}

/** 4-byte Sony touch point: contact(bit7 = inactive, low 7 = id), 12-bit x, 12-bit y. */
export function decodeTouch(d: DataView, off: number, width: number, height: number): Touch {
  const c = d.getUint8(off)
  const b1 = d.getUint8(off + 1)
  const b2 = d.getUint8(off + 2)
  const b3 = d.getUint8(off + 3)
  return {
    id: c & 0x7f,
    active: (c & 0x80) === 0,
    x: (b1 | ((b2 & 0x0f) << 8)) / width,
    y: ((b2 >> 4) | (b3 << 4)) / height,
  }
}
