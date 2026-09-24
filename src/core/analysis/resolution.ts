/** Effective bit depth of an axis from the smallest step seen between distinct values. */
export function resolutionBits(values: Iterable<number>): { bits: number; distinct: number } {
  const set = new Set<number>()
  for (const v of values) set.add(v)
  if (set.size < 2) return { bits: 0, distinct: set.size }
  const sorted = [...set].sort((a, b) => a - b)
  let step = Infinity
  for (let i = 1; i < sorted.length; i++) {
    const d = sorted[i]! - sorted[i - 1]!
    if (d > 1e-9 && d < step) step = d
  }
  if (!isFinite(step)) return { bits: 0, distinct: set.size }
  return { bits: Math.round(Math.log2(2 / step)), distinct: set.size }
}
