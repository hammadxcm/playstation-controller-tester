import type { Point, Verdict } from './types'

export const BINS = 72

export interface CircularityResult {
  /** mean |r - 1| over filled bins, in percent */
  errorPct: number
  /** fraction of the 72 angular bins that received an outer-edge sample */
  coverage: number
  minR: number
  maxR: number
  /** max radius per 5° bin, 0 where unfilled */
  bins: number[]
  incompleteRange: boolean
  verdict: Verdict
}

/** Outer-edge sweep analysis. Feed all samples; only those beyond 0.5 magnitude count. */
export function circularity(samples: readonly Point[]): CircularityResult {
  const bins = new Array<number>(BINS).fill(0)
  for (const p of samples) {
    const r = Math.hypot(p.x, p.y)
    if (r < 0.5) continue
    const a = Math.atan2(p.y, p.x)
    const i = Math.floor(((a + Math.PI) / (2 * Math.PI)) * BINS) % BINS
    if (r > bins[i]!) bins[i] = r
  }
  const filled = bins.filter((r) => r > 0)
  if (!filled.length) {
    return {
      errorPct: 0,
      coverage: 0,
      minR: 0,
      maxR: 0,
      bins,
      incompleteRange: false,
      verdict: 'good',
    }
  }
  const err = filled.reduce((s, r) => s + Math.abs(r - 1), 0) / filled.length
  const minR = Math.min(...filled)
  const maxR = Math.max(...filled)
  const errorPct = err * 100
  const coverage = filled.length / BINS
  return {
    errorPct,
    coverage,
    minR,
    maxR,
    bins,
    incompleteRange: coverage > 0.9 && minR < 0.9,
    verdict: errorPct < 10 ? 'good' : errorPct < 20 ? 'ok' : 'bad',
  }
}
