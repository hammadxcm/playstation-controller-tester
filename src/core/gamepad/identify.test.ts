import { describe, expect, it } from 'vitest'
import { identify } from './identify'

describe('identify', () => {
  it('parses Chromium ids', () => {
    const p = identify(
      'DualSense Wireless Controller (STANDARD GAMEPAD Vendor: 054c Product: 0ce6)',
    )
    expect(p).toEqual({
      family: 'dualsense',
      name: 'DualSense Wireless Controller',
      vid: 0x054c,
      pid: 0x0ce6,
    })
  })
  it('parses Firefox ids, including unpadded legacy ones', () => {
    expect(identify('054c-09cc-Wireless Controller')).toMatchObject({
      family: 'dualshock4',
      pid: 0x09cc,
    })
    expect(identify('810-3-USB Gamepad')).toMatchObject({
      family: 'generic',
      vid: 0x810,
      pid: 3,
      name: 'USB Gamepad',
    })
  })
  it('falls back to name heuristics for Safari', () => {
    expect(identify('DUALSHOCK4 Wireless Controller Extended Gamepad')).toMatchObject({
      family: 'dualshock4',
      vid: undefined,
    })
    expect(identify('Xbox Wireless Controller Extended Gamepad').family).toBe('xbox')
  })
  it('covers DS4 variants, name heuristics and empty ids', () => {
    expect(identify('X (Vendor: 054c Product: 05c4)').family).toBe('dualshock4')
    expect(identify('X (Vendor: 054c Product: 0ba0)').family).toBe('dualshock4')
    expect(identify('X (Vendor: 054c Product: 1234)').family).toBe('generic')
    expect(identify('DualSense Edge Wireless Controller Extended Gamepad').family).toBe('dualsense')
    expect(identify('').name).toBe('Gamepad')
  })
  it('detects Xbox by vendor and Edge by pid', () => {
    expect(
      identify('Xbox Wireless Controller (STANDARD GAMEPAD Vendor: 045e Product: 0b13)').family,
    ).toBe('xbox')
    expect(identify('X (Vendor: 054c Product: 0df2)').family).toBe('dualsense')
  })
})
