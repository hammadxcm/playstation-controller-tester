import { describe, expect, it } from 'vitest'
import { GEOMETRY } from './geometry'

describe('geometry', () => {
  it('every family defines every standard control', () => {
    for (const [name, g] of Object.entries(GEOMETRY)) {
      for (const k of ['ls', 'rs', 'face', 'dpad', 'l1', 'r1', 'l2', 'r2', 'select', 'start', 'home', 'grips'] as const) expect(g[k], `${name}.${k}`).toBeDefined()
    }
    expect(GEOMETRY.xbox.impulseTriggers).toBe(true)
    expect(GEOMETRY.dualsense.touchpad).toBeDefined()
    expect(GEOMETRY.dualsense.leds?.length).toBe(5)
    expect(GEOMETRY.dualshock4.lightbar?.kind).toBe('top')
  })
})
