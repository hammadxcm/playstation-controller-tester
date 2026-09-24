import type { Point } from './types'

export interface DeadzoneResult {
  /** smallest non-zero magnitude reported; large values mean the firmware clamps a deadzone */
  inner: number
  /** largest jump between consecutive samples inside the centre region */
  centerSkip: number
  axisSnapping: boolean
}

/** Feed samples from a slow spiral out of centre. */
export function deadzone(samples: readonly Point[]): DeadzoneResult {
  let inner = Infinity
  let centerSkip = 0
  let onAxis = 0
  let near = 0
  for (let i = 0; i < samples.length; i++) {
    const p = samples[i]!
    const r = Math.hypot(p.x, p.y)
    if (r > 0 && r < inner) inner = r
    if (r > 0 && r < 0.3) {
      near++
      if (p.x === 0 || p.y === 0) onAxis++
    }
    if (i > 0) {
      const q = samples[i - 1]!
      if (r < 0.25 && Math.hypot(q.x, q.y) < 0.25) {
        centerSkip = Math.max(centerSkip, Math.hypot(p.x - q.x, p.y - q.y))
      }
    }
  }
  return {
    inner: isFinite(inner) ? inner : 0,
    centerSkip,
    axisSnapping: near > 20 && onAxis / near > 0.6,
  }
}
