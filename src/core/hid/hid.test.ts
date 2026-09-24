import { describe, expect, it } from 'vitest'
import { crc32, SEED, sonyCrc } from './sony/crc32'
import { decodeTouch } from './sony/touch'
import { parseDualSense } from './dualsense/input'
import { encodeOutput, emptyOutput } from './dualsense/output'
import * as fx from './dualsense/triggerEffects'
import { encodeOutput as encodeDs4 } from './dualshock4/output'
import { parseDualShock4 } from './dualshock4/input'

const hex = (s: string) => new Uint8Array(s.trim().split(/\s+/).map((h) => parseInt(h, 16)))

// nondebug/dualsense sample: USB input report, all inputs neutral, report id stripped
const NEUTRAL = hex(`7e 81 84 84 00 00 4b 08 00 00 00 ac 0a af 14 f2 ff 0a 00 f2 ff b8 ff ff 1d 9e 08 da 8f e8 ae 1b
  fc 3e 00 26 f9 7f 87 0b bd 09 09 00 00 00 00 00 92 a0 e8 ae 29 08 00 b0 7e c8 76 f8 cc a2 2b`)

describe('crc32', () => {
  it('matches the standard check value and chains', () => {
    const bytes = new TextEncoder().encode('123456789')
    expect(crc32(bytes)).toBe(0xcbf43926)
    expect(crc32(bytes.subarray(4), crc32(bytes.subarray(0, 4)))).toBe(0xcbf43926)
  })
  it('seeds Sony output CRC with a2 + report id', () => {
    const body = new Uint8Array(73)
    expect(sonyCrc(SEED.output, 0x31, body)).toBe(crc32(new Uint8Array([0xa2, 0x31, ...body])))
  })
})

describe('touch', () => {
  it('decodes inactive and active points', () => {
    const d = new DataView(hex('fc 3e 00 26  05 80 07 30').buffer)
    expect(decodeTouch(d, 0, 1920, 1080)).toMatchObject({ id: 0x7c, active: false })
    const t = decodeTouch(d, 4, 1920, 1080)
    expect(t).toMatchObject({ id: 5, active: true })
    expect(t.x * 1920).toBe(0x780)
    expect(t.y * 1080).toBe(0x300)
  })
})

describe('DualSense input', () => {
  it('parses the neutral USB capture', () => {
    const s = parseDualSense(new DataView(NEUTRAL.buffer), 0, null, 0, 1)
    expect(s.sticks).toEqual({ lx: 0x7e, ly: 0x81, rx: 0x84, ry: 0x84 })
    expect(s.triggers).toEqual({ l2: 0, r2: 0 })
    expect(s.hat).toBe(8)
    expect(Object.values(s.buttons).some(Boolean)).toBe(false)
    expect(s.gyro).toEqual([-14, 10, -14])
    expect(s.accel).toEqual([-72, 0x1dff, 0x089e])
    expect(s.accelG[1]).toBeCloseTo(0x1dff / 8192, 3)
    expect(s.touches.every((t) => !t.active)).toBe(true)
    expect(s.battery).toEqual({ percent: 95, state: 'full' })
    expect(s.flags.usb).toBe(true)
    expect(s.extra.seq).toBe(0x4b)
  })
  it('reads the same bytes at the BT offset', () => {
    const bt = new Uint8Array(1 + NEUTRAL.length)
    bt.set(NEUTRAL, 1)
    expect(parseDualSense(new DataView(bt.buffer), 1, null, 0, 0x31).sticks.lx).toBe(0x7e)
  })
})

describe('DualSense output', () => {
  it('sets only the flags for fields present', () => {
    const o = emptyOutput()
    o.lightbar = [255, 0, 128]
    const p = encodeOutput(o)
    expect(p.length).toBe(47)
    expect(p[0]).toBe(0)
    expect(p[1]).toBe(1 << 2)
    expect([p[44], p[45], p[46]]).toEqual([255, 0, 128])
  })
  it('places trigger effects and rumble', () => {
    const o = emptyOutput()
    o.rumble = { strong: 1, weak: 0.5 }
    o.trigger.right = fx.feedback(0, 8)
    o.lightbarSetup = true
    const p = encodeOutput(o)
    expect(p[0]).toBe(0b0111) // compat vibration + haptics + right trigger
    expect(p[2]).toBe(128)
    expect(p[3]).toBe(255)
    expect(p[10]).toBe(0x21)
    expect(p[38]! & 0b10).toBe(0b10)
    expect(p[41]).toBe(2)
  })
})

describe('trigger effects', () => {
  it('encodes off as mode 0x05', () => {
    expect([...fx.off()]).toEqual([5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
  })
  it('encodes feedback zones and force', () => {
    const b = fx.feedback(2, 8)
    expect(b[0]).toBe(0x21)
    expect(b[1]! | (b[2]! << 8)).toBe(0b1111111100)
    const force = (b[3]! | (b[4]! << 8) | (b[5]! << 16) | (b[6]! << 24)) >>> 0
    expect((force >>> 6) & 7).toBe(7) // zone 2
    expect(force & 0b111111).toBe(0) // zones 0,1 inactive
  })
  it('encodes weapon and vibration', () => {
    expect([...fx.weapon(2, 5, 8).subarray(0, 4)]).toEqual([0x25, 0x24, 0x00, 7])
    const v = fx.vibration(3, 4, 30)
    expect(v[0]).toBe(0x26)
    expect(v[9]).toBe(30)
  })
  it('collapses no-op effects to off', () => {
    expect(fx.feedback(0, 0)[0]).toBe(5)
    expect(fx.vibration(0, 5, 0)[0]).toBe(5)
  })
})

describe('DualShock 4', () => {
  it('encodes output flags', () => {
    const p = encodeDs4({ rumble: { strong: 1, weak: 0 }, lightbar: [0, 0, 255], flash: null })
    expect(p[0]).toBe(0b011)
    expect(p[4]).toBe(255)
    expect(p[7]).toBe(255)
  })
  it('parses a synthetic USB state', () => {
    const raw = new Uint8Array(64)
    raw.set([128, 128, 128, 128, 0x28, 0x01, 0x02, 0, 255], 0) // hat 8, cross, l1, tpad click, r2 full
    raw[29] = 0x1b // cable + level 11 → full
    const s = parseDualShock4(new DataView(raw.buffer), 0, null, 0, 1)
    expect(s.buttons).toMatchObject({ cross: true, l1: true, touchpad: true })
    expect(s.triggers.r2).toBe(255)
    expect(s.battery).toEqual({ percent: 100, state: 'full' })
  })
})
