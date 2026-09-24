import { STD, type Frame } from '@/core/gamepad/types'

/**
 * Idle choreography for the hero: a pure function of time so the landing looks alive without hardware
 * and tests can assert exact instants. Left stick circles, right stick traces a figure-eight, triggers sweep,
 * one face button blinks every cycle, the d-pad taps now and then.
 */
const FACE = [STD.south, STD.east, STD.west, STD.north] as const
const BLINK_PERIOD = 2.6
const BLINK_LEN = 0.22
const TAP_PERIOD = 7
const TAP_LEN = 0.18

export function demoFrame(t: number): Frame {
  const buttons = Array.from({ length: 18 }, () => ({ pressed: false, value: 0 }))
  const cycle = Math.floor(t / BLINK_PERIOD)
  if (t % BLINK_PERIOD < BLINK_LEN)
    buttons[FACE[cycle % FACE.length]!] = { pressed: true, value: 1 }
  if (t % TAP_PERIOD < TAP_LEN && t >= TAP_PERIOD) buttons[STD.right] = { pressed: true, value: 1 }
  const l2 = (Math.sin(t * 0.9) + 1) / 2
  const r2 = (Math.sin(t * 0.9 + Math.PI) + 1) / 2
  buttons[STD.l2] = { pressed: l2 > 0.5, value: l2 }
  buttons[STD.r2] = { pressed: r2 > 0.5, value: r2 }
  const w = t * 2 * Math.PI * 0.35
  const axes = [
    0.55 * Math.cos(w),
    0.55 * Math.sin(w),
    0.4 * Math.sin(w * 0.5),
    0.4 * Math.sin(w) * Math.cos(w * 0.5),
  ]
  return { index: -1, id: 'demo', mapping: 'standard', t: t * 1000, hwT: 0, axes, buttons }
}

/** Frozen pose for reduced motion: sticks slightly deflected, one trigger part-way, nothing blinking. */
export const DEMO_STILL: Frame = demoFrame(0.3)
