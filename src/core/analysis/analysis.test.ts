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

const circle = (r: number, n = 360) =>
  Array.from({ length: n }, (_, i) => {
    const a = (i / n) * 2 * Math.PI
    return { x: r * Math.cos(a), y: r * Math.sin(a) }
  })

describe('drift', () => {
  it('is zero for a centred stick', () => {
    expect(drift(Array(50).fill({ x: 0, y: 0 }))).toMatchObject({ magnitude: 0, verdict: 'good' })
  })
  it('flags an offset centre', () => {
    const r = drift(Array(50).fill({ x: 0.08, y: 0 }))
    expect(r.magnitude).toBeCloseTo(0.08)
    expect(r.verdict).toBe('bad')
  })
})

describe('circularity', () => {
  it('scores a perfect circle at 0 %', () => {
    const r = circularity(circle(1))
    expect(r.errorPct).toBeCloseTo(0, 5)
    expect(r.coverage).toBe(1)
    expect(r.verdict).toBe('good')
  })
  it('flags a stick that never reaches the edge', () => {
    const r = circularity(circle(0.8))
    expect(r.errorPct).toBeCloseTo(20, 5)
    expect(r.incompleteRange).toBe(true)
  })
  it('ignores samples near centre', () => {
    expect(circularity(circle(0.2)).coverage).toBe(0)
  })
})

describe('resolutionBits', () => {
  it('detects 8-bit and 12-bit axes', () => {
    const eight = Array.from({ length: 256 }, (_, i) => (i / 255) * 2 - 1)
    const twelve = Array.from({ length: 4096 }, (_, i) => (i / 4095) * 2 - 1)
    expect(resolutionBits(eight).bits).toBe(8)
    expect(resolutionBits(twelve).bits).toBe(12)
  })
})

describe('deadzone', () => {
  it('reports the smallest non-zero magnitude', () => {
    const s = [
      { x: 0, y: 0 },
      { x: 0.12, y: 0 },
      { x: 0.3, y: 0 },
    ]
    expect(deadzone(s).inner).toBeCloseTo(0.12)
  })
})

describe('pollingRate', () => {
  it('reads 250 Hz from 4 ms deltas', () => {
    const ts = Array.from({ length: 50 }, (_, i) => i * 4)
    expect(pollingRate(ts).hz).toBe(250)
  })
})

describe('ButtonTracker', () => {
  it('counts presses and chatter', () => {
    const t = new ButtonTracker()
    t.feed(0, true, 0)
    t.feed(0, false, 50)
    t.feed(0, true, 60) // 10 ms after release → chatter
    t.feed(0, false, 100)
    expect(t.get(0)).toMatchObject({ presses: 2, chatter: 1, longestHoldMs: 50 })
  })
  it('flags stuck buttons', () => {
    const t = new ButtonTracker()
    t.feed(1, true, 0)
    t.feed(1, true, 11_000)
    expect(t.get(1)?.stuck).toBe(true)
  })
})

describe('score', () => {
  it('grades a perfect pad A and a broken pad F', () => {
    expect(
      score({
        driftMagnitude: 0,
        circularityErrorPct: 0,
        resolutionBits: 12,
        pollingHz: 250,
        chatterEvents: 0,
        stuckButtons: 0,
      }),
    ).toMatchObject({ score: 100, grade: 'A' })
    expect(
      score({
        driftMagnitude: 0.2,
        circularityErrorPct: 40,
        resolutionBits: 4,
        pollingHz: 30,
        chatterEvents: 9,
        stuckButtons: 1,
      }).grade,
    ).toBe('F')
  })
})
