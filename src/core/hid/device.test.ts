import { describe, expect, it } from 'vitest'
import { FakeHidDevice } from '@/testing/fakeHidDevice'
import { DualSenseDevice } from './dualsense/device'
import { DualShock4Device } from './dualshock4/device'
import { detectByBits, detectByIds, inputReportBits } from './sony/device'
import { crc32, SEED, sonyCrc } from './sony/crc32'
import type { HidLogEntry } from './log'
import { PID, SONY } from '../gamepad/identify'

const tick = () => new Promise((r) => setTimeout(r, 0))
const fwReport = (update: number) => {
  const b = new Uint8Array(65)
  b[0] = 0x20
  b[44] = update & 0xff
  b[45] = update >> 8
  return b
}
const calReport = () => {
  const b = new Uint8Array(42)
  b[0] = 0x05
  const dv = new DataView(b.buffer)
  // gyro plus/minus ±1000 around 0 bias, speed 2000+2000, accel ±8192
  const vals = [0, 0, 0, 1000, -1000, 1000, -1000, 1000, -1000, 2000, 2000, 8192, -8192, 8192, -8192, 8192, -8192]
  vals.forEach((v, i) => dv.setInt16(1 + i * 2, v, true))
  return b
}
const neutralUsb = () => {
  const b = new Uint8Array(63)
  b.set([0x7e, 0x81, 0x84, 0x84, 0, 0, 0x4b, 0x08], 0)
  b[52] = 0x29
  return b
}
const bt31 = () => {
  const b = new Uint8Array(77)
  b[0] = 0x01
  b.set(neutralUsb(), 1)
  return b
}
const validBtCrc = (id: number, body: Uint8Array) => {
  const stored = body[73]! | (body[74]! << 8) | (body[75]! << 16) | ((body[76]! << 24) >>> 0)
  return (stored >>> 0) === sonyCrc(SEED.output, id, body.subarray(0, 73))
}

function ds(opts: { inputBits?: number; outputIds?: number[] } = {}, pid: number = PID.dualsense) {
  const log: HidLogEntry[] = []
  const fake = new FakeHidDevice(SONY, pid, 'DualSense', opts)
  fake.features.set(0x05, calReport())
  fake.features.set(0x20, fwReport(0x0215))
  const dev = new DualSenseDevice(fake.asHid(), (e) => log.push(e))
  return { fake, dev, log }
}

describe('transport detection', () => {
  it('reads the largest gamepad input report in bits', () => {
    expect(inputReportBits(new FakeHidDevice(1, 1, 'x', { inputBits: 616 }).asHid())).toBe(616)
    expect(detectByBits(new FakeHidDevice(1, 1, 'x', { inputBits: 504 }).asHid())).toBe('usb')
    expect(detectByBits(new FakeHidDevice(1, 1, 'x', { inputBits: 616 }).asHid())).toBe('bt')
    expect(detectByBits(new FakeHidDevice(1, 1, 'x', { inputBits: 8 }).asHid())).toBe('unknown')
  })
  it('falls back to output report ids', () => {
    const ids = { inputUsb: 1, inputBt: 0x31, outputUsb: 2, outputBt: 0x31, calibration: [] }
    expect(detectByIds(new FakeHidDevice(1, 1, 'x', { outputIds: [0x31, 0x32] }).asHid(), ids)).toBe('bt')
    expect(detectByIds(new FakeHidDevice(1, 1, 'x', { outputIds: [0x02] }).asHid(), ids)).toBe('usb')
    expect(detectByIds(new FakeHidDevice(1, 1, 'x', { outputIds: [] }).asHid(), ids)).toBe('unknown')
  })
})

describe('DualSense over USB', () => {
  it('opens, reads calibration + firmware, sends the init packet, then user packets', async () => {
    const { fake, dev, log } = ds()
    await dev.open()
    expect(dev.transport).toBe('usb')
    expect(fake.sent.length).toBe(1)
    const init = fake.sent[0]!
    expect(init.id).toBe(0x02)
    expect(init.data.length).toBe(62)
    expect(init.data[0]).toBe(0xff) // every flag0 path enabled
    expect(init.data[1]! & 0b10111).toBe(0b10111) // mic LED, power save, lightbar, player LEDs
    expect(init.data[38]! & 0b10).toBe(0b10)
    expect(init.data[41]).toBe(0x02) // fade the boot glow
    await dev.setLightbar([255, 0, 68])
    const pkt = fake.sent[1]!.data
    expect([pkt[44], pkt[45], pkt[46]]).toEqual([255, 0, 68])
    expect(pkt[1]! & 0b100).toBe(0b100)
    expect(await dev.info()).toMatchObject({ updateVersion: '2.21', transport: 'usb' })
    expect(log.some((e) => e.dir === 'out' && e.note === 'init')).toBe(true)
  })
  it('uses v2 vibration flag on new firmware and compat flag on old', async () => {
    const a = ds()
    await a.dev.open()
    await a.dev.rumble(1, 0.5)
    let p = a.fake.sent.at(-1)!.data
    expect(p[38]! & 0b100).toBe(0b100)
    expect(p[0]! & 0b1).toBe(0)
    expect([p[2], p[3]]).toEqual([128, 255])
    const b = ds()
    b.fake.features.set(0x20, fwReport(0x0210))
    await b.dev.open()
    await b.dev.rumble(1, 1)
    p = b.fake.sent.at(-1)!.data
    expect(p[0]! & 0b11).toBe(0b11)
    expect(p[38]! & 0b100).toBe(0)
  })
  it('sets the brightness flag with player LEDs', async () => {
    const { fake, dev } = ds()
    await dev.open()
    await dev.setPlayerLeds(0b10101, 2)
    const p = fake.sent.at(-1)!.data
    expect(p[1]! & 0b10000).toBe(0b10000)
    expect(p[38]! & 0b1).toBe(0b1)
    expect(p[42]).toBe(2)
    expect(p[43]).toBe(0b10101)
  })
  it('coalesces bursts: one packet in flight, latest state wins', async () => {
    const { fake, dev } = ds()
    await dev.open()
    fake.sendDelayMs = 5
    const all = Promise.all([dev.setLightbar([1, 0, 0]), dev.setLightbar([2, 0, 0]), dev.setLightbar([3, 0, 0])])
    await all
    const user = fake.sent.slice(1)
    expect(user.length).toBeLessThanOrEqual(2)
    expect(user.at(-1)!.data[44]).toBe(3)
  })
  it('surfaces send errors in the log and rejects', async () => {
    const { fake, dev, log } = ds()
    await dev.open()
    fake.failSend = new Error('NotAllowedError')
    await expect(dev.setMicLed('on')).rejects.toThrow('NotAllowedError')
    expect(log.at(-1)).toMatchObject({ dir: 'error' })
    expect(log.at(-1)!.note).toContain('NotAllowedError')
  })
  it('parses input, applies calibration, and sends an off packet that releases LEDs on close', async () => {
    const { fake, dev } = ds()
    const seen: number[] = []
    dev.subscribe((s) => seen.push(s.sticks.lx, s.gyroDps[0]))
    await dev.open()
    const raw = neutralUsb()
    raw[15] = 0xe8
    raw[16] = 0x03 // gyro x = 1000 raw → with ±1000 calibration and 4000 speed = 2000 °/s
    fake.input(0x01, raw)
    expect(seen[0]).toBe(0x7e)
    expect(seen[1]).toBeCloseTo(2000)
    await dev.close()
    const off = fake.sent.at(-1)!.data
    expect(off[1]! & 0b1000).toBe(0b1000)
    expect(off[10]).toBe(0x05)
    expect(fake.opened).toBe(false)
  })
  it('reports Edge capability from the product id', () => {
    expect(ds({}, PID.dualsenseEdge).dev.caps.edge).toBe(true)
    expect(ds({}, PID.dualsenseEdge).dev.label).toBe('DualSense Edge')
  })
})

describe('DualSense over Bluetooth', () => {
  it('waits for the first 0x31 report, then frames with seq nibble, tag 0x10 and CRC', async () => {
    const { fake, dev } = ds({ inputBits: 616, outputIds: [0x31] })
    const opening = dev.open()
    await tick()
    expect(fake.sent.length).toBe(0)
    fake.input(0x31, bt31())
    await opening
    expect(dev.transport).toBe('bt')
    expect(fake.sent[0]!.id).toBe(0x31)
    const init = fake.sent[0]!.data
    expect(init.length).toBe(77)
    expect(init[1]).toBe(0x10)
    expect(validBtCrc(0x31, init)).toBe(true)
    await dev.setLightbar([0, 255, 0])
    const p = fake.sent[1]!.data
    expect(p[0]! >> 4).toBe(1) // sequence advanced
    expect(p[2 + 45]).toBe(255)
    expect(validBtCrc(0x31, p)).toBe(true)
    await dev.close()
  })
  it('queues user output until the transport is confirmed and flushes it afterwards', async () => {
    const { fake, dev } = ds({ inputBits: 8, outputIds: [] })
    const opening = dev.open()
    const lb = dev.setLightbar([9, 9, 9])
    await tick()
    expect(fake.sent.length).toBe(0)
    fake.input(0x31, bt31())
    await opening
    await lb
    expect(fake.sent.some((s) => s.data[2 + 44] === 9)).toBe(true)
    await dev.close()
  })
  it('re-reads calibration when a reduced 0x01 report arrives before promotion', async () => {
    const { fake, dev } = ds({ inputBits: 616, outputIds: [0x31] })
    fake.features.delete(0x05)
    const opening = dev.open()
    await tick()
    fake.features.set(0x05, calReport())
    fake.input(0x01, new Uint8Array(9))
    await tick()
    fake.input(0x31, bt31())
    await opening
    expect(dev.transport).toBe('bt')
    await dev.close()
  })
})

describe('DualShock 4', () => {
  it('frames Bluetooth output with 0xC0 and a valid CRC, no sequence nibble', async () => {
    const fake = new FakeHidDevice(SONY, PID.ds4v2, 'Wireless Controller', { inputBits: 616, outputIds: [0x11] })
    fake.features.set(0x05, calReport())
    const dev = new DualShock4Device(fake.asHid())
    const opening = dev.open()
    await tick()
    const b = new Uint8Array(77)
    b[0] = 0xc0
    fake.input(0x11, b)
    await opening
    expect(dev.transport).toBe('bt')
    await dev.setLightbar([0, 0, 255])
    await dev.setLightbar([0, 0, 200])
    const p = fake.sent.at(-1)!.data
    expect(p[0]).toBe(0xc0)
    expect(p[2]! & 0b10).toBe(0b10)
    expect(p[9]).toBe(200)
    expect(validBtCrc(0x11, p)).toBe(true)
    await dev.close()
    expect(fake.sent.at(-1)!.data[2]! & 0b1).toBe(0b1) // off packet carries rumble flag with zero motors
  })
  it('sends 31-byte USB reports with report id 0x05', async () => {
    const fake = new FakeHidDevice(SONY, PID.ds4v2, 'Wireless Controller', { outputIds: [0x05] })
    fake.features.set(0x02, calReport())
    const dev = new DualShock4Device(fake.asHid())
    await dev.open()
    expect(dev.transport).toBe('usb')
    await dev.rumble(0.5, 1)
    const s = fake.sent.at(-1)!
    expect(s.id).toBe(0x05)
    expect(s.data.length).toBe(31)
    expect([s.data[3], s.data[4]]).toEqual([255, 128])
    expect(crc32(new Uint8Array(0))).toBe(0)
  })
})
