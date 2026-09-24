import { describe, expect, it } from 'vitest'
import type { HidController } from '@/core/hid/controller'
import { EMPTY_OUTPUT, trackOutput, type HidOutput } from './hidOutput'
import { fx } from './fx'

const fake = (): HidController & { calls: string[] } => {
  const calls: string[] = []
  const rec = (n: string) => async () => { calls.push(n) }
  return {
    calls, family: 'dualsense', label: 'x', transport: 'usb', device: {} as HIDDevice,
    caps: { touchpad: true, motion: true, battery: true, rumble: true, lightbar: true, lightbarFlash: false, playerLeds: true, micLed: true, adaptiveTriggers: true, edge: false },
    subscribe: () => () => {}, rumble: rec('rumble'), setLightbar: rec('lightbar'), setLightbarFlash: rec('flash'),
    setPlayerLeds: rec('leds'), setMicLed: rec('mic'), setTrigger: rec('trigger'), info: async () => ({}), close: rec('close'),
  }
}

describe('trackOutput', () => {
  it('forwards calls and mirrors state after they resolve', async () => {
    let out: HidOutput = { ...EMPTY_OUTPUT }
    const inner = fake()
    const w = trackOutput(inner, (p) => { out = { ...out, ...p } }, () => out)
    await w.setLightbar([1, 2, 3])
    await w.setPlayerLeds(0b101, 1)
    await w.setTrigger('left', new Uint8Array([0x21]))
    await w.setTrigger('right', new Uint8Array())
    expect(inner.calls).toEqual(['lightbar', 'leds', 'trigger', 'trigger'])
    expect(out.lightbar).toEqual([1, 2, 3])
    expect(out.playerLeds).toEqual({ mask: 5, brightness: 1 })
    expect(out.trigger).toEqual({ left: 0x21, right: 0x05 })
  })
  it('exposes passthrough members and omits optional ones the device lacks', async () => {
    const inner = fake()
    const w = trackOutput(inner, () => {}, () => EMPTY_OUTPUT)
    expect(w.transport).toBe('usb')
    expect(typeof w.subscribe(() => {})).toBe('function')
    expect(await w.info()).toEqual({})
    await w.close()
    expect(inner.calls).toContain('close')
    expect(w.setAudio).toBeUndefined()
    expect(w.factory).toBeUndefined()
    await w.setMicLed('on')
    await w.setLightbarFlash(1, 2)
    await w.setLightbarFlash(0, 0)
  })
  it('emits rumble and stop effects', async () => {
    const seen: string[] = []
    const off1 = fx.on('rumble', (r) => seen.push(`r${r.strong}`))
    const off2 = fx.on('stop', () => seen.push('stop'))
    const w = trackOutput(fake(), () => {}, () => EMPTY_OUTPUT)
    await w.rumble(1, 0)
    await w.rumble(0, 0)
    expect(seen).toEqual(['r1', 'stop'])
    off1(); off2()
  })
})
