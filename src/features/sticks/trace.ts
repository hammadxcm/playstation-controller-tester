import { BINS } from '@/core/analysis'

export interface StickTrace {
  points: { x: number; y: number }[]
  cur: { x: number; y: number }
  /** angular bins touched at the outer edge (circularity coverage) */
  bins: Uint8Array
  filled: number
}

export const newTrace = (): StickTrace => ({
  points: [],
  cur: { x: 0, y: 0 },
  bins: new Uint8Array(BINS),
  filled: 0,
})

const MAX_FADE = 240
const MAX_CONST = 6000

export function pushTrace(
  t: StickTrace,
  x: number,
  y: number,
  mode: 'fade' | 'constant' | 'none',
): void {
  t.cur = { x, y }
  if (Math.hypot(x, y) >= 0.5) {
    const i = Math.floor(((Math.atan2(y, x) + Math.PI) / (2 * Math.PI)) * BINS) % BINS
    if (!t.bins[i]) {
      t.bins[i] = 1
      t.filled++
    }
  }
  if (mode === 'none') return
  const p = t.points
  const last = p[p.length - 1]
  if (last && last.x === x && last.y === y) return
  p.push({ x, y })
  const cap = mode === 'fade' ? MAX_FADE : MAX_CONST
  if (p.length > cap) p.splice(0, p.length - cap)
}

export function resetTrace(t: StickTrace): void {
  t.points = []
  t.bins.fill(0)
  t.filled = 0
}
