import { describe, expect, it } from 'vitest'
import { STD } from '@/core/gamepad/types'
import { DEMO_STILL, demoFrame } from './demoFrame'

describe('demoFrame', () => {
  it('is a standard 18-button frame that is deterministic in time', () => {
    const f = demoFrame(1.5)
    expect(f.buttons).toHaveLength(18)
    expect(f.mapping).toBe('standard')
    expect(f.axes).toHaveLength(4)
    expect(demoFrame(1.5)).toEqual(f)
    for (const a of f.axes) expect(Math.abs(a)).toBeLessThanOrEqual(0.55)
  })
  it('blinks one face button per cycle, cycling south → east → west → north', () => {
    expect(demoFrame(0.1).buttons[STD.south]!.pressed).toBe(true)
    expect(demoFrame(0.5).buttons[STD.south]!.pressed).toBe(false)
    expect(demoFrame(2.7).buttons[STD.east]!.pressed).toBe(true)
    expect(demoFrame(5.3).buttons[STD.west]!.pressed).toBe(true)
    expect(demoFrame(7.9).buttons[STD.north]!.pressed).toBe(true)
    expect(demoFrame(10.5).buttons[STD.south]!.pressed).toBe(true)
  })
  it('taps d-pad right every seven seconds, but not in the first cycle', () => {
    expect(demoFrame(0.1).buttons[STD.right]!.pressed).toBe(false)
    expect(demoFrame(7.1).buttons[STD.right]!.pressed).toBe(true)
    expect(demoFrame(7.5).buttons[STD.right]!.pressed).toBe(false)
  })
  it('sweeps the triggers out of phase', () => {
    const a = demoFrame(0)
    expect(a.buttons[STD.l2]!.value).toBeCloseTo(0.5)
    expect(a.buttons[STD.r2]!.value).toBeCloseTo(0.5)
    const b = demoFrame(Math.PI / 2 / 0.9)
    expect(b.buttons[STD.l2]!.value).toBeCloseTo(1)
    expect(b.buttons[STD.l2]!.pressed).toBe(true)
    expect(b.buttons[STD.r2]!.value).toBeCloseTo(0)
    expect(b.buttons[STD.r2]!.pressed).toBe(false)
  })
  it('exposes a frozen still with nothing blinking', () => {
    expect(DEMO_STILL.buttons[STD.south]!.pressed).toBe(false)
    expect(DEMO_STILL.axes[0]).not.toBe(0)
  })
})
