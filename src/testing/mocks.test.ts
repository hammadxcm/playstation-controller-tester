// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { FakeHidDevice } from './fakeHidDevice'
import { createMockHid, installMockHid } from './mockHid'
import { POSES } from './poses'
import { useStore } from '@/state/store'

describe('poses', () => {
  it('defines the standard screenshot poses', () => {
    expect(Object.keys(POSES)).toContain('all')
    expect(POSES.all!.buttons[0]).toBe(1)
  })
})

describe('FakeHidDevice', () => {
  it('records sends from ArrayBuffer and typed arrays, and supports forget', async () => {
    const f = new FakeHidDevice(1, 2, 'x')
    await f.sendReport(1, new ArrayBuffer(3))
    await f.sendReport(2, new Uint8Array([7, 8]))
    await f.sendFeatureReport(3, new ArrayBuffer(2))
    await f.sendFeatureReport(4, new Uint8Array([1]))
    expect(f.featureSent.length).toBe(2)
    expect(f.sent[0]!.data.length).toBe(3)
    expect(Array.from(f.sent[1]!.data)).toEqual([7, 8])
    f.failFeature = new Error('nope')
    await expect(f.receiveFeatureReport(1)).rejects.toThrow('nope')
    await f.forget()
    await f.open()
    await f.close()
    expect(f.opened).toBe(false)
  })
})

describe('mock HID', () => {
  it('produces synthetic state for DualSense and DualShock 4 and records commands', async () => {
    vi.useFakeTimers()
    ;(window as unknown as { __ct: unknown }).__ct = { gp: { axes: [0, 0, 0, 0], buttons: Array.from({ length: 18 }, () => ({ pressed: false, value: 0 })) } }
    const m = createMockHid('dualsense')
    const seen: unknown[] = []
    const off = m.subscribe((s) => seen.push(s))
    await vi.advanceTimersByTimeAsync(20)
    expect(seen.length).toBeGreaterThan(0)
    expect(m.state().battery.percent).toBe(75)
    await m.setLightbar([1, 2, 3])
    await m.setTrigger('left', new Uint8Array([0x21]))
    expect(m.state().extra.l2Engaged).toBe(true)
    await m.setTrigger('left', new Uint8Array([0x05]))
    await m.setTrigger('right', new Uint8Array([0x21]))
    expect(m.state().extra.r2Status).toBe(1)
    await m.rumble(1, 1)
    await m.setLightbarFlash(1, 2)
    await m.setPlayerLeds(1, 0)
    await m.setMicLed('on')
    expect(Object.keys(m.out)).toContain('lightbar')
    expect((await m.info()).updateVersion).toBe('2.21')
    expect((await m.factory!()).serial).toBe('MOCK00012345')
    off()
    await m.close()
    const ds4 = createMockHid('dualshock4')
    expect(ds4.family).toBe('dualshock4')
    expect(await ds4.factory!()).toEqual({})
    expect(ds4.state().buttons.share).toBe(false)
    await ds4.close()
    vi.useRealTimers()
  })
  it('installs navigator.hid, injects mocks into the store and applies URL options', async () => {
    ;(window as unknown as { __ct: unknown }).__ct = { gp: { axes: [0, 0, 0, 0], buttons: Array.from({ length: 18 }, () => ({ pressed: false, value: 0 })) } }
    const q = new URLSearchParams('hid=2&lb=ff0044&leds=P3&mic=pulse&flash=100,200&trig=left:weapon')
    const mock = await installMockHid('dualsense', q)
    expect('hid' in navigator).toBe(true)
    const nh = navigator.hid as unknown as { addEventListener(): void; removeEventListener(): void; getDevices(): Promise<unknown[]>; requestDevice(): Promise<unknown[]> }
    nh.addEventListener()
    nh.removeEventListener()
    expect(await nh.getDevices()).toEqual([])
    expect(await nh.requestDevice()).toEqual([])
    expect(useStore.getState().hids.length).toBe(2)
    expect(useStore.getState().hidOut.lightbar).toEqual([255, 0, 68])
    expect(useStore.getState().hidOut.playerLeds.mask).toBe(0b10101)
    expect(useStore.getState().hidOut.micLed).toBe('pulse')
    expect(useStore.getState().hidOut.trigger.left).toBe(0x25)
    await mock.close()
    const q2 = new URLSearchParams('hid=2&leds=mask:7&trig=right:feedback')
    const m2 = await installMockHid('dualshock4', q2)
    expect(useStore.getState().hidOut.playerLeds.mask).toBe(7)
    expect(useStore.getState().hids[1]!.family).toBe('dualsense')
    await m2.close()
    const m3 = await installMockHid('dualsense', new URLSearchParams('hid=1&edge=1'))
    expect(useStore.getState().hidOut.lightbar).toBeNull()
    expect(m3.caps.edge).toBe(true)
    expect(m3.label).toBe('DualSense Edge (mock)')
    await m3.close()
    useStore.getState().setHid(null)
  })
})
