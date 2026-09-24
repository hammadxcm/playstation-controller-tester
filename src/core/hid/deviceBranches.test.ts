import { afterEach, describe, expect, it, vi } from 'vitest'
import { FakeHidDevice } from '@/testing/fakeHidDevice'
import { DualSenseDevice } from './dualsense/device'
import { DualShock4Device } from './dualshock4/device'
import { detectByIds, inputReportBits } from './sony/device'
import { PID, SONY } from '../gamepad/identify'
import type { HidLogEntry } from './log'

const tick = (ms = 0) => new Promise((r) => setTimeout(r, ms))
afterEach(() => vi.useRealTimers())

describe('device branches', () => {
  it('DualSense: missing firmware report, short BT frames, close error, mic modes, flash no-op', async () => {
    const fake = new FakeHidDevice(SONY, PID.dualsense, 'DualSense')
    const log: HidLogEntry[] = []
    const dev = new DualSenseDevice(fake.asHid(), (e) => log.push(e))
    const seen: unknown[] = []
    dev.subscribe((s) => seen.push(s))
    await dev.open()
    expect((await dev.info()).firmware).toBe('unavailable')
    fake.input(0x31, new Uint8Array(10)) // too short → ignored
    fake.input(0x01, new Uint8Array(9)) // reduced mode → calibration retry
    expect(seen.length).toBe(0)
    await dev.setMicLed('off')
    await dev.setMicLed('pulse')
    await dev.setTrigger('right', new Uint8Array([0x21]))
    expect(fake.sent.at(-1)!.data[10]).toBe(0x21)
    expect(await dev.factory()).toEqual({})
    const st = new Uint8Array(63)
    st[52] = 0xa0
    fake.input(0x01, st)
    expect((seen.at(-1) as { battery: { state: string } }).battery.state).toBe('unknown')
    await dev.setLightbarFlash()
    await dev.setLightbar(null)
    expect(fake.sent.at(-1)!.data[44]).toBe(0)
    fake.close = async () => {
      throw new Error('nope')
    }
    await dev.close()
    expect(log.some((e) => e.note?.includes('close: nope'))).toBe(true)
  })
  it('DualSense: info before open reads the report; DS4 short calibration and null lightbar', async () => {
    const fake = new FakeHidDevice(SONY, PID.dualsense, 'DualSense')
    fake.features.set(0x20, new Uint8Array(65))
    expect((await new DualSenseDevice(fake.asHid()).info()).firmware).toBe('0x00000000')
    const f4 = new FakeHidDevice(SONY, PID.ds4v2, 'DS4', { outputIds: [0x05] })
    f4.features.set(0x02, new Uint8Array(10))
    const d4 = new DualShock4Device(f4.asHid())
    await d4.open()
    await d4.setLightbar(null)
    expect(f4.sent.at(-1)!.data[5]).toBe(0)
    await d4.close()
  })
  it('SonyDevice: descriptor edge cases, unsubscribe, keepalive skips while a send is in flight, close paths', async () => {
    const odd = new FakeHidDevice(SONY, PID.dualsense, 'DualSense')
    ;(odd as unknown as { collections: unknown[] }).collections = [
      {
        usagePage: 0x0c,
        usage: 0x01,
        inputReports: [{ items: [{ reportSize: 8, reportCount: 100 }] }],
      },
      { usagePage: 0x01, usage: 0x05 },
      { usagePage: 0x01, usage: 0x05, inputReports: [{ items: [{}] }, {}], outputReports: [{}] },
    ]
    expect(inputReportBits(odd.asHid())).toBe(0)
    const ids = { inputUsb: 1, inputBt: 0x31, outputUsb: 2, outputBt: 0x31, calibration: [] }
    expect(detectByIds(odd.asHid(), ids)).toBe('unknown')
    const never = new DualSenseDevice(odd.asHid())
    await never.close() // never opened, transport unknown → nothing sent
    expect(odd.sent.length).toBe(0)
    vi.useFakeTimers()
    const fake = new FakeHidDevice(SONY, PID.dualsense, 'DualSense', {
      inputBits: 616,
      outputIds: [0x31],
    })
    const dev = new DualSenseDevice(fake.asHid())
    const off = dev.subscribe(() => undefined)
    off()
    const opening = dev.open()
    await vi.advanceTimersByTimeAsync(1)
    fake.input(0x31, new Uint8Array(77))
    await opening
    await dev.setLightbar([0, 0, 1]) // first queued send starts the keepalive timer
    fake.sendDelayMs = 700
    const slow = dev.setLightbar([1, 1, 1])
    await vi.advanceTimersByTimeAsync(550) // keepalive tick while the slow send is in flight → skipped
    await vi.advanceTimersByTimeAsync(200)
    await slow
    const n = fake.sent.length
    fake.sendDelayMs = 0
    fake.failSend = new Error('gone')
    await dev.close()
    expect(fake.sent.length).toBe(n)
    vi.useRealTimers()
  })
  it('DualSense: calibration report without id byte and short calibration are tolerated', async () => {
    const fake = new FakeHidDevice(SONY, PID.dualsense, 'DualSense')
    fake.features.set(0x05, new Uint8Array(10))
    fake.features.set(0x20, new Uint8Array(64)) // no id byte → off -1 path
    const dev = new DualSenseDevice(fake.asHid())
    await dev.open()
    expect((await dev.info()).updateVersion).toBe('0.0')
    fake.features.set(0x05, new Uint8Array(40))
    await dev.close()
  })
  it('SonyDevice: unknown transport times out then initialises when a report finally arrives', async () => {
    vi.useFakeTimers()
    const fake = new FakeHidDevice(SONY, PID.dualsense, 'DualSense', {
      inputBits: 8,
      outputIds: [],
    })
    const log: HidLogEntry[] = []
    const dev = new DualSenseDevice(fake.asHid(), (e) => log.push(e))
    const opening = dev.open()
    await vi.advanceTimersByTimeAsync(3000)
    await opening
    expect(dev.transport).toBe('unknown')
    expect(log.some((e) => e.note?.includes('no full input report'))).toBe(true)
    const lb = dev.setLightbar([1, 2, 3])
    expect(log.some((e) => e.note?.includes('queued'))).toBe(true)
    const full = new Uint8Array(63)
    fake.input(0x01, full)
    await vi.advanceTimersByTimeAsync(10)
    await lb
    expect(dev.transport).toBe('usb')
    expect(fake.sent.length).toBe(2)
    vi.useRealTimers()
  })
  it('SonyDevice: Bluetooth keepalive resends state and stops on close', async () => {
    vi.useFakeTimers()
    const fake = new FakeHidDevice(SONY, PID.dualsense, 'DualSense', {
      inputBits: 616,
      outputIds: [0x31],
    })
    const dev = new DualSenseDevice(fake.asHid())
    const opening = dev.open()
    await vi.advanceTimersByTimeAsync(1)
    const bt = new Uint8Array(77)
    fake.input(0x31, bt)
    await opening
    await dev.setLightbar([1, 1, 1])
    const n = fake.sent.length
    await vi.advanceTimersByTimeAsync(1100)
    expect(fake.sent.length).toBeGreaterThan(n)
    fake.failSend = new Error('gone')
    await vi.advanceTimersByTimeAsync(600)
    fake.failSend = null
    await dev.close()
    const m = fake.sent.length
    await vi.advanceTimersByTimeAsync(1100)
    expect(fake.sent.length).toBe(m)
    vi.useRealTimers()
  })
  it('SonyDevice: rejects every waiter when a coalesced send fails, and off packet errors are swallowed', async () => {
    const fake = new FakeHidDevice(SONY, PID.dualsense, 'DualSense')
    const dev = new DualSenseDevice(fake.asHid())
    await dev.open()
    fake.sendDelayMs = 5
    const a = dev.setLightbar([1, 0, 0])
    fake.failSend = new Error('busy')
    const b = dev.setLightbar([2, 0, 0])
    await expect(Promise.all([a, b])).rejects.toThrow()
    await dev.close()
  })
  it('DualShock 4: USB reduced report, non-HID BT frame, calibration id mismatch, no-op setters', async () => {
    const fake = new FakeHidDevice(SONY, PID.ds4v1, 'DS4', { outputIds: [0x05] })
    fake.features.set(0x02, new Uint8Array(41))
    const dev = new DualShock4Device(fake.asHid())
    expect(dev.label).toBe('DualShock 4 (v1)')
    expect(
      new DualShock4Device(new FakeHidDevice(SONY, PID.ds4dongle, 'x').asHid()).label,
    ).toContain('adapter')
    const seen: unknown[] = []
    dev.subscribe((s) => seen.push(s))
    await dev.open()
    fake.input(0x01, new Uint8Array(10))
    fake.input(0x11, new Uint8Array(77))
    fake.input(0x11, new Uint8Array(10))
    fake.input(0x01, new Uint8Array(64))
    expect(seen.length).toBe(1)
    await dev.setPlayerLeds()
    await dev.setMicLed()
    await dev.setTrigger()
    await dev.setLightbarFlash(0, 0)
    expect(fake.sent.at(-1)!.data[7]).toBe(64)
    await dev.setLightbarFlash(100, 200)
    expect(fake.sent.at(-1)!.data[8]).toBe(10)
    expect((await dev.info()).transport).toBe('usb')
    await dev.close()
  })
  it('DualShock 4 over BT without calibration still opens after the first frame', async () => {
    const fake = new FakeHidDevice(SONY, PID.ds4v2, 'DS4', { inputBits: 616, outputIds: [0x11] })
    const dev = new DualShock4Device(fake.asHid())
    const opening = dev.open()
    await tick()
    const b = new Uint8Array(77)
    b[0] = 0xc0
    fake.input(0x11, b)
    await opening
    expect(dev.transport).toBe('bt')
    await dev.close()
  })
})
