export interface ScoreInput {
  driftMagnitude: number
  circularityErrorPct: number
  resolutionBits: number
  pollingHz: number
  chatterEvents: number
  stuckButtons: number
}

export interface ScoreResult {
  score: number
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  breakdown: Record<keyof ScoreInput, number>
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v))

/** Weighted 0–100. Weights: drift 30, circularity 25, resolution 15, polling 15, buttons 15. */
export function score(i: ScoreInput): ScoreResult {
  const breakdown = {
    driftMagnitude: 30 * clamp01(1 - i.driftMagnitude / 0.08),
    circularityErrorPct: 25 * clamp01(1 - i.circularityErrorPct / 25),
    resolutionBits: 15 * clamp01((i.resolutionBits - 4) / 8),
    pollingHz: 15 * clamp01((i.pollingHz - 30) / 220),
    chatterEvents: 8 * clamp01(1 - i.chatterEvents / 5),
    stuckButtons: i.stuckButtons ? 0 : 7,
  }
  const total = Math.round(Object.values(breakdown).reduce((s, v) => s + v, 0))
  const grade = total >= 90 ? 'A' : total >= 75 ? 'B' : total >= 60 ? 'C' : total >= 40 ? 'D' : 'F'
  return { score: total, grade, breakdown }
}
