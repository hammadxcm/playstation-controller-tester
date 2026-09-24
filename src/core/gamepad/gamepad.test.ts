// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { hapticCaps, rumble, stopRumble } from './haptics'
import { applyLayout, deleteLayout, emptyLayout, getLayout, saveLayout } from './mapping'
import { PROFILES } from './profiles'
import { getGamepad, onFrames, onPads, snapshot } from './poller'
import type { Frame } from './types'

const pad = (over: Partial<Gamepad> & { actuator?: unknown } = {}) =>
  ({ index: 0, id: 'X (STANDARD GAMEPAD Vendor: 054c Product: 0ce6)', mapping: 'standard', connected: true, timestamp: 5, axes: [0.1, 0.2, 0.3, 0.4], buttons: [{ pressed: true, value: 1, touched: true }], vibrationActuator: over.actuator, ...over }) as unknown as Gamepad

describe('haptics', () => {
  it('detects capabilities from effects or legacy type', () => {
    expect(hapticCaps(null)).toEqual({ dual: false, trigger: false })
    expect(hapticCaps(pad({ actuator: { playEffect: () => 0, effects: ['dual-rumble', 'trigger-rumble'] } }))).toEqual({ dual: true, trigger: true })
    expect(hapticCaps(pad({ actuator: { playEffect: () => 0, type: 'dual-rumble' } }))).toEqual({ dual: true, trigger: false })
    expect(hapticCaps(pad({ actuator: { playEffect: () => 0, type: 'other' } }))).toEqual({ dual: false, trigger: false })
  })
  it('plays dual or trigger rumble and reports errors', async () => {
    const playEffect = vi.fn(async (..._args: unknown[]) => 'complete')
    const gp = pad({ actuator: { playEffect, effects: ['dual-rumble', 'trigger-rumble'] } })
    expect(await rumble(gp, { duration: 100, strong: 1 })).toBe('complete')
    expect(playEffect.mock.calls[0]![0]).toBe('dual-rumble')
    await rumble(gp, { duration: 100, leftTrigger: 0.5 })
    expect(playEffect.mock.calls[1]![0]).toBe('trigger-rumble')
    await rumble(gp, { duration: 100, rightTrigger: 0.5 })
    expect((playEffect.mock.calls[2]![1] as { leftTrigger: number }).leftTrigger).toBe(0)
    expect(await rumble(null, { duration: 1 })).toBe('unsupported')
    const bad = pad({ actuator: { playEffect: async () => { throw new DOMException('x', 'NotSupportedError') }, effects: ['dual-rumble'] } })
    expect(await rumble(bad, { duration: 1 })).toBe('NotSupportedError')
    const bad2 = pad({ actuator: { playEffect: async () => { throw 'boom' }, effects: ['dual-rumble'] } })
    expect(await rumble(bad2, { duration: 1 })).toBe('error')
    const reset = vi.fn(async () => undefined)
    await stopRumble(pad({ actuator: { playEffect, reset, effects: ['dual-rumble'] } }))
    expect(reset).toHaveBeenCalled()
    await stopRumble(pad({ actuator: { playEffect, effects: [] } }))
    await stopRumble(pad({ actuator: { playEffect, reset: async () => { throw new Error('x') }, effects: [] } }))
    await stopRumble(null)
  })
})

describe('mapping', () => {
  afterEach(() => localStorage.clear())
  it('persists and applies learned layouts', () => {
    const layout = emptyLayout()
    layout.buttons.south = 3
    layout.axes.lx = 1
    saveLayout('padA', layout)
    expect(getLayout('padA')?.buttons.south).toBe(3)
    const f: Frame = { index: 0, id: 'padA', mapping: '', t: 0, hwT: 0, axes: [0, 0.7, 0, 0], buttons: [{ pressed: false, value: 0 }, { pressed: false, value: 0 }, { pressed: false, value: 0 }, { pressed: true, value: 1 }] }
    const shaped = applyLayout(f, layout)
    expect(shaped.mapping).toBe('learned')
    expect(shaped.buttons[0]).toEqual({ pressed: true, value: 1 })
    expect(shaped.axes[0]).toBe(0.7)
    expect(shaped.axes[1]).toBe(0)
    const std = { ...f, mapping: 'standard' }
    expect(applyLayout(std, layout)).toBe(std)
    expect(applyLayout(f)).toBe(f)
    deleteLayout('padA')
    expect(getLayout('padA')).toBeUndefined()
    localStorage.setItem('ct:layouts', '{bad json')
    expect(getLayout('x')).toBeUndefined()
  })
})

describe('profiles', () => {
  it('names every family', () => {
    expect(PROFILES.dualsense.buttons.select).toBe('Create')
    expect(PROFILES.dualshock4.buttons.select).toBe('Share')
    expect(PROFILES.xbox.triggerRumble).toBe(true)
    expect(PROFILES.generic.label).toBe('Gamepad')
  })
})

describe('poller', () => {
  it('snapshots pads, fans out frames and pad-set changes, stops when unsubscribed', async () => {
    const pads: (Gamepad | null)[] = [pad(), null]
    Object.defineProperty(navigator, 'getGamepads', { value: () => pads, configurable: true })
    const rafs: FrameRequestCallback[] = []
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { rafs.push(cb); return rafs.length })
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    expect(snapshot(pad({ timestamp: undefined }), 1).hwT).toBe(0)
    const s = snapshot(pad(), 7)
    expect(s.axes).toEqual([0.1, 0.2, 0.3, 0.4])
    expect(s.t).toBe(7)
    const frames: Frame[][] = []
    const sets: unknown[] = []
    const offF = onFrames((f) => frames.push(f))
    const offP = onPads((p) => sets.push(p))
    rafs.shift()!(0)
    expect(frames.length).toBe(1)
    expect(sets.length).toBe(1)
    rafs.shift()!(16)
    expect(sets.length).toBe(1) // unchanged set
    pads[0] = null
    rafs.shift()!(32)
    expect(sets.length).toBe(2)
    expect(getGamepad(0)).toBeNull()
    offF()
    offP()
    expect(cancelAnimationFrame).toHaveBeenCalled()
    vi.unstubAllGlobals()
  })
})
