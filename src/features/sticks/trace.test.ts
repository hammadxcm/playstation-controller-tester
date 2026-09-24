import { describe, expect, it } from 'vitest'
import { BINS } from '@/core/analysis'
import { newTrace, pushTrace, resetTrace } from './trace'

describe('trace', () => {
  it('records points, dedupes repeats and caps fade mode', () => {
    const t = newTrace()
    pushTrace(t, 0.1, 0.1, 'fade')
    pushTrace(t, 0.1, 0.1, 'fade')
    expect(t.points.length).toBe(1)
    for (let i = 0; i < 300; i++) pushTrace(t, i / 1000, 0, 'fade')
    expect(t.points.length).toBe(240)
    for (let i = 0; i < 6002; i++) pushTrace(t, i / 10000, 0.3, 'constant')
    expect(t.points.length).toBe(6000)
    pushTrace(t, 0.5, 0.5, 'none')
    expect(t.cur).toEqual({ x: 0.5, y: 0.5 })
  })
  it('fills angular bins only at the outer edge', () => {
    const t = newTrace()
    pushTrace(t, 0.2, 0, 'none')
    expect(t.filled).toBe(0)
    for (let i = 0; i < 360; i++)
      pushTrace(t, Math.cos((i / 180) * Math.PI), Math.sin((i / 180) * Math.PI), 'none')
    expect(t.filled).toBe(BINS)
    resetTrace(t)
    expect(t.filled).toBe(0)
    expect(t.points).toEqual([])
  })
})
