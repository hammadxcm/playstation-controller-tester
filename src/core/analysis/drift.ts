import type { Point, Verdict } from './types'

export interface DriftResult {
  x: number
  y: number
  magnitude: number
  samples: number
  verdict: Verdict
}

/** Resting offset of a stick. Feed samples taken while the stick is untouched. */
export function drift(samples: readonly Point[]): DriftResult {
  const n = samples.length
  if (!n) return { x: 0, y: 0, magnitude: 0, samples: 0, verdict: 'good' }
  let sx = 0
  let sy = 0
  for (const p of samples) {
    sx += p.x
    sy += p.y
  }
  const x = sx / n
  const y = sy / n
  const magnitude = Math.hypot(x, y)
  const verdict: Verdict = magnitude < 0.02 ? 'good' : magnitude < 0.06 ? 'ok' : 'bad'
  return { x, y, magnitude, samples: n, verdict }
}
