export type HidLogDir = 'out' | 'in' | 'feature-in' | 'feature-out' | 'info' | 'error'

export interface HidLogEntry {
  t: number
  dir: HidLogDir
  reportId?: number
  bytes?: Uint8Array
  note?: string
  ms?: number
}

export type HidLogger = (entry: HidLogEntry) => void

export const hex = (u: ArrayLike<number> | undefined, max = 80): string =>
  u ? Array.from(u.length > max ? Array.prototype.slice.call(u, 0, max) : u, (b: number) => b.toString(16).padStart(2, '0')).join(' ') + (u.length > max ? ' …' : '') : ''
