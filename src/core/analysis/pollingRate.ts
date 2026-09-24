export interface PollingResult {
  hz: number
  jitterMs: number
  samples: number
}

/** Report rate from timestamps of frames whose input actually changed. Browser-observed only. */
export function pollingRate(timestamps: readonly number[]): PollingResult {
  const deltas: number[] = []
  for (let i = 1; i < timestamps.length; i++) {
    const d = timestamps[i]! - timestamps[i - 1]!
    if (d > 0 && d < 100) deltas.push(d)
  }
  if (deltas.length < 5) return { hz: 0, jitterMs: 0, samples: deltas.length }
  deltas.sort((a, b) => a - b)
  const median = deltas[Math.floor(deltas.length / 2)]!
  const mean = deltas.reduce((s, d) => s + d, 0) / deltas.length
  const jitterMs = Math.sqrt(deltas.reduce((s, d) => s + (d - mean) ** 2, 0) / deltas.length)
  return { hz: Math.round(1000 / median), jitterMs, samples: deltas.length }
}
