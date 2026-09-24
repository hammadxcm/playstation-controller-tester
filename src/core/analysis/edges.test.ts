import { describe, expect, it } from 'vitest'
import {
  ButtonTracker,
  circularity,
  deadzone,
  drift,
  pollingRate,
  resolutionBits,
  score,
} from './index'

describe('analysis edge cases', () => {
  it('drift verdict tiers', () => {
    expect(drift([{ x: 0.03, y: 0 }]).verdict).toBe('ok')
    expect(drift([]).samples).toBe(0)
  })
  it('circularity verdict tiers and incomplete-range gate', () => {
    const ring = (r: number) =>
      Array.from({ length: 360 }, (_, i) => ({
        x: r * Math.cos((i / 180) * Math.PI),
        y: r * Math.sin((i / 180) * Math.PI),
      }))
    expect(circularity(ring(0.85)).verdict).toBe('ok')
    expect(circularity(ring(0.6)).verdict).toBe('bad')
    expect(circularity(ring(0.85).slice(0, 90)).incompleteRange).toBe(false)
  })
  it('deadzone: axis snapping, centre skipping, no samples', () => {
    const snap = Array.from({ length: 40 }, (_, i) => ({ x: i % 2 ? 0.1 : 0, y: i % 2 ? 0 : 0.1 }))
    expect(deadzone(snap).axisSnapping).toBe(true)
    expect(
      deadzone([
        { x: 0, y: 0 },
        { x: 0.2, y: 0 },
      ]).centerSkip,
    ).toBeCloseTo(0.2)
    expect(deadzone([]).inner).toBe(0)
    expect(
      deadzone([
        { x: 0.5, y: 0.5 },
        { x: 0.9, y: 0.9 },
      ]).centerSkip,
    ).toBe(0)
    expect(deadzone(Array.from({ length: 30 }, () => ({ x: 0.1, y: 0.1 }))).axisSnapping).toBe(
      false,
    )
    expect(resolutionBits([0, 1e-12]).bits).toBe(0)
  })
  it('pollingRate ignores gaps and needs five samples', () => {
    expect(pollingRate([0, 1, 2]).hz).toBe(0)
    expect(pollingRate([0, 4, 8, 500, 504, 508, 512, 516, 520]).hz).toBe(250)
  })
  it('resolutionBits with one value or identical values', () => {
    expect(resolutionBits([0.5]).bits).toBe(0)
    expect(resolutionBits([0.5, 0.5, 0.5]).bits).toBe(0)
  })
  it('score grade tiers', () => {
    const base = {
      driftMagnitude: 0,
      circularityErrorPct: 0,
      resolutionBits: 12,
      pollingHz: 250,
      chatterEvents: 0,
      stuckButtons: 0,
    }
    expect(score({ ...base, driftMagnitude: 0.03 }).grade).toBe('B')
    expect(score({ ...base, driftMagnitude: 0.06, circularityErrorPct: 10 }).grade).toBe('C')
    expect(score({ ...base, driftMagnitude: 0.08, pollingHz: 30 }).grade).toBe('D')
  })
  it('ButtonTracker resets and reports all', () => {
    const t = new ButtonTracker()
    t.feed(0, true, 0)
    t.feed(0, false, 10)
    expect(t.all().length).toBe(1)
    t.reset()
    expect(t.all()).toEqual([])
    expect(t.get(0)).toBeUndefined()
  })
})
