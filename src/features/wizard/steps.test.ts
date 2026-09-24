import { describe, expect, it } from 'vitest'
import type { Frame } from '@/core/gamepad/types'
import { buildSteps, DEFAULT_METRICS } from './steps'

const frame = (t: number, axes: number[], pressed: number[] = []): Frame => ({
  index: 0,
  id: 'x',
  mapping: 'standard',
  t,
  hwT: t,
  axes,
  buttons: Array.from({ length: 18 }, (_, i) => ({
    pressed: pressed.includes(i),
    value: pressed.includes(i) ? 1 : 0,
  })),
})

describe('wizard steps', () => {
  it('builds six steps with sensible defaults', () => {
    const steps = buildSteps()
    expect(steps.map((s) => s.id)).toEqual([
      'drift',
      'circle-left',
      'circle-right',
      'resolution',
      'polling',
      'buttons',
    ])
    expect(DEFAULT_METRICS.resolutionBits).toBe(8)
  })
  it('drift step times out and reports both sticks', () => {
    const [drift] = buildSteps()
    drift!.feed(frame(0, [0.05, 0, 0, 0]))
    drift!.feed(frame(3000, [0.05, 0, 0, 0]))
    expect(drift!.progress()).toBe(1)
    const out = drift!.finish()
    expect(out.rows[0]!.value).toBe('0.0500')
    expect(out.metrics.driftMagnitude).toBeCloseTo(0.05)
  })
  it('circularity steps complete after a full lap and flag short range', () => {
    const [, left, right] = buildSteps()
    for (let i = 0; i < 360; i++)
      left!.feed(frame(i, [Math.cos((i / 180) * Math.PI), Math.sin((i / 180) * Math.PI), 0, 0]))
    expect(left!.progress()).toBe(1)
    expect(left!.finish().rows[0]!.tone).toBe('good')
    for (let i = 0; i < 360; i++)
      right!.feed(
        frame(i, [0, 0, 0.8 * Math.cos((i / 180) * Math.PI), 0.8 * Math.sin((i / 180) * Math.PI)]),
      )
    right!.feed(frame(400, [0, 0, 0.1, 0]))
    const out = right!.finish()
    expect(out.rows.some((r) => r.value.includes('edge'))).toBe(true)
  })
  it('tolerates frames without axes or hardware timestamps, caps samples, grades partial results', () => {
    const [drift, left, , res, poll, btn] = buildSteps()
    const bare: Frame = {
      index: 0,
      id: 'x',
      mapping: 'standard',
      t: 0,
      hwT: 0,
      axes: [],
      buttons: [],
    }
    drift!.feed(bare)
    left!.feed(bare)
    res!.feed(bare)
    poll!.feed(bare)
    btn!.feed(bare)
    for (let i = 0; i < 20001; i++) left!.feed(frame(i, [0.9, 0, 0, 0]))
    for (let i = 0; i < 20002; i++) res!.feed(frame(i, [0.1, 0.1, 0, 0]))
    const mid = buildSteps()[4]!
    for (let i = 0; i < 40; i++) mid.feed(frame(i * 10, [i / 100, 0, 0, 0]))
    expect(mid.finish().rows[0]!.tone).toBe('ok')
    expect(left!.finish().rows[1]!.tone).toBe('ok')
    for (let i = 0; i < 40; i++) poll!.feed(frame(1 + i * 25, [i / 100, 0, 0, 0]))
    expect(poll!.finish().rows[0]!.tone).toBe('bad')
    btn!.feed(frame(10, [0, 0, 0, 0], [1]))
    btn!.feed(frame(50, [0, 0, 0, 0]))
    const out = btn!.finish()
    expect(out.rows[0]!.tone).toBe('ok')
    expect(out.rows[1]!.tone).toBe('good')
    expect(out.rows.length).toBe(2)
  })
  it('resolution, polling and buttons steps produce metrics', () => {
    const [, , , res, poll, btn] = buildSteps()
    for (let i = 0; i < 256; i++)
      res!.feed(frame(i * 10, [(i / 255) * 2 - 1, (i / 255) * 2 - 1, 0, 0]))
    expect(res!.progress()).toBeGreaterThan(0)
    expect(res!.finish().metrics.resolutionBits).toBe(8)
    const empty = buildSteps()[3]!
    expect(empty.finish().metrics.resolutionBits).toBe(8)
    for (let i = 0; i < 50; i++) poll!.feed(frame(i * 4, [i / 100, 0, 0, 0]))
    expect(poll!.progress()).toBeGreaterThan(0)
    expect(poll!.finish().rows[0]!.value).toContain('250 Hz')
    const quiet = buildSteps()[4]!
    quiet.feed(frame(0, [0, 0, 0, 0]))
    expect(quiet.finish().metrics.pollingHz).toBe(60)
    for (let i = 0; i < 17; i++) {
      btn!.feed(frame(i * 100, [0, 0, 0, 0], [i]))
      btn!.feed(frame(i * 100 + 50, [0, 0, 0, 0]))
    }
    btn!.feed(frame(2000, [0, 0, 0, 0], [0]))
    btn!.feed(frame(2005, [0, 0, 0, 0]))
    btn!.feed(frame(2010, [0, 0, 0, 0], [0])) // chatter
    btn!.feed(frame(20000, [0, 0, 0, 0], [0])) // stuck
    expect(btn!.progress()).toBe(1)
    const out = btn!.finish()
    expect(out.metrics.chatterEvents).toBe(1)
    expect(out.rows.some((r) => r.label === 'Stuck buttons')).toBe(true)
  })
})
