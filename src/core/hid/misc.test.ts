import { describe, expect, it } from 'vitest'
import { noop } from './controller'
import { hex } from './log'
import { FILTERS, openController, reopenGranted, requestController, webHidSupported } from './registry'
import { FakeHidDevice } from '@/testing/fakeHidDevice'
import { PID, SONY } from '../gamepad/identify'
import { emptyOutput, encodeOutput } from './dualsense/output'
import * as fx from './dualsense/triggerEffects'
import { parseDualShock4 } from './dualshock4/input'
import { applyCalibration, parseCalibration } from './sony/calibration'

describe('misc', () => {
  it('hex formats and truncates', async () => {
    expect(hex(new Uint8Array([1, 255]))).toBe('01 ff')
    expect(hex(undefined)).toBe('')
    expect(hex(new Uint8Array(100), 4)).toBe('00 00 00 00 …')
    await expect(noop()).resolves.toBeUndefined()
  })
  it('registry picks drivers by product id and reports WebHID support', async () => {
    expect(FILTERS.length).toBe(5)
    expect(webHidSupported()).toBe(false)
    const ds = new FakeHidDevice(SONY, PID.dualsense, 'DualSense')
    const ds4 = new FakeHidDevice(SONY, PID.ds4v2, 'DS4', { outputIds: [0x05] })
    const other = new FakeHidDevice(0x045e, 0x0b12, 'Xbox')
    const sonyUnknown = new FakeHidDevice(SONY, 0x1234, 'Other Sony')
    expect(await openController(other.asHid())).toBeNull()
    expect(await openController(sonyUnknown.asHid())).toBeNull()
    expect((await openController(ds.asHid()))?.family).toBe('dualsense')
    expect((await openController(ds4.asHid()))?.family).toBe('dualshock4')
    const broken = new FakeHidDevice(SONY, PID.dualsense, 'Broken')
    broken.open = async () => { throw new Error('busy') }
    const log: string[] = []
    Object.defineProperty(navigator, 'hid', { value: { getDevices: async () => [broken, ds], requestDevice: async () => [ds4] }, configurable: true })
    expect(webHidSupported()).toBe(true)
    const reopened = await reopenGranted((e) => log.push(e.note ?? ''))
    expect(reopened.length).toBe(1)
    expect(log[0]).toContain('busy')
    expect((await requestController())?.family).toBe('dualshock4')
    Object.defineProperty(navigator, 'hid', { value: { requestDevice: async () => [] }, configurable: true })
    expect(await requestController()).toBeNull()
  })
  it('encodes v2 vibration and release flag directly', () => {
    const o = emptyOutput()
    o.vibrationV2 = true
    o.rumble = { strong: 0.5, weak: 0.25 }
    o.micLed = 2
    const p = encodeOutput(o)
    expect(p[0]! & 0b11).toBe(0b10)
    expect(p[38]! & 0b100).toBe(0b100)
    expect(p[8]).toBe(2)
  })
  it('covers every trigger effect encoder and their no-op collapses', () => {
    expect(fx.multiPositionFeedback([0, 0, 3, 0, 0, 0, 0, 0, 0, 8])[0]).toBe(0x21)
    expect(fx.multiPositionFeedback([])[0]).toBe(5)
    expect(fx.weapon(2, 5, 0)[0]).toBe(5)
    expect(fx.bow(0, 4, 5, 6)[0]).toBe(0x22)
    expect(fx.bow(0, 4, 0, 6)[0]).toBe(5)
    expect(fx.galloping(0, 9, 1, 3, 4)[0]).toBe(0x23)
    expect(fx.galloping(0, 9, 1, 3, 0)[0]).toBe(5)
    const m = fx.machine(1, 9, 7, 2, 20, 5)
    expect(m[0]).toBe(0x27)
    expect(m[5]).toBe(5)
    expect(fx.machine(1, 9, 7, 2, 0, 5)[0]).toBe(5)
  })
  it('parses DS4 touch data when present and battery unknown state', () => {
    const raw = new Uint8Array(64)
    raw[29] = 0x0b // no cable, level 11 → 100 %
    raw[32] = 1
    raw[34] = 0x05
    raw[35] = 0x80
    raw[36] = 0x07
    raw[37] = 0x30
    const s = parseDualShock4(new DataView(raw.buffer), 0, null, 0, 1)
    expect(s.touches[0]).toMatchObject({ id: 5, active: true })
    expect(s.battery.percent).toBe(100)
    expect(s.battery.state).toBe('discharging')
    raw[29] = 0x15
    expect(parseDualShock4(new DataView(raw.buffer), 0, null, 0, 1).battery.state).toBe('charging')
    const short = parseDualShock4(new DataView(new Uint8Array(32).buffer), 0, null, 0, 1)
    expect(short.touches).toEqual([])
  })
  it('calibration handles grouped layout and zero ranges', () => {
    const b = new Uint8Array(41)
    const dv = new DataView(b.buffer)
    ;[0, 0, 0, 500, 500, 500, -500, -500, -500, 1000, 1000, 0, 0, 0, 0, 0, 0].forEach((v, i) => dv.setInt16(1 + i * 2, v, true))
    const cal = parseCalibration(dv, 1, true)
    expect(cal.gyroDenom[0]).toBe(1000)
    expect(cal.accelRange[0]).toBe(32767)
    const r = applyCalibration([500, 0, 0], [100, 0, 0], cal, { gyroPerDps: 16, accelPerG: 8192 })
    expect(r.gyroDps[0]).toBeCloseTo(1000)
    const zero = new DataView(new Uint8Array(41).buffer)
    const c0 = parseCalibration(zero, 1)
    expect(c0.gyroNumer[0]).toBe(32767)
  })
})
