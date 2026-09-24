import { decodeTouch } from '../sony/touch'
import type { HidState } from '../controller'
import { SENSOR, TOUCHPAD } from './constants'
import { applyCalibration, type Calibration, type Vec3 } from '../sony/calibration'

const BATTERY_STATE = ['discharging', 'charging', 'full'] as const

/** Parse the 63-byte DualSense state starting at `off` within `d`. */
export function parseDualSense(d: DataView, off: number, cal: Calibration | null, t: number, reportId: number): HidState {
  const u8 = (o: number) => d.getUint8(off + o)
  const i16 = (o: number) => d.getInt16(off + o, true)
  const b0 = u8(7)
  const b1 = u8(8)
  const b2 = u8(9)
  const gyro: Vec3 = [i16(15), i16(17), i16(19)]
  const accel: Vec3 = [i16(21), i16(23), i16(25)]
  const status = u8(52)
  const plug = u8(53)
  const r2s = u8(41)
  const l2s = u8(42)
  const st = status >> 4
  return {
    sticks: { lx: u8(0), ly: u8(1), rx: u8(2), ry: u8(3) },
    triggers: { l2: u8(4), r2: u8(5) },
    hat: b0 & 0x0f,
    buttons: {
      square: !!(b0 & 0x10), cross: !!(b0 & 0x20), circle: !!(b0 & 0x40), triangle: !!(b0 & 0x80),
      l1: !!(b1 & 0x01), r1: !!(b1 & 0x02), l2: !!(b1 & 0x04), r2: !!(b1 & 0x08),
      create: !!(b1 & 0x10), options: !!(b1 & 0x20), l3: !!(b1 & 0x40), r3: !!(b1 & 0x80),
      ps: !!(b2 & 0x01), touchpad: !!(b2 & 0x02), mute: !!(b2 & 0x04),
      fnL: !!(b2 & 0x10), fnR: !!(b2 & 0x20), paddleL: !!(b2 & 0x40), paddleR: !!(b2 & 0x80),
    },
    touches: [decodeTouch(d, off + 32, TOUCHPAD.width, TOUCHPAD.height), decodeTouch(d, off + 36, TOUCHPAD.width, TOUCHPAD.height)],
    gyro,
    accel,
    ...applyCalibration(gyro, accel, cal, SENSOR),
    sensorTs: d.getUint32(off + 27, true) / 3,
    battery: { percent: Math.min((status & 0x0f) * 10 + 5, 100), state: BATTERY_STATE[st] ?? 'unknown' },
    flags: { headphones: !!(plug & 0x01), mic: !!(plug & 0x02), usb: !!(plug & 0x08) || !!(plug & 0x10) },
    extra: {
      seq: u8(6),
      r2Status: r2s >> 4, r2Stop: r2s & 0x0f, r2Engaged: !!(r2s & 0x10),
      l2Status: l2s >> 4, l2Stop: l2s & 0x0f, l2Engaged: !!(l2s & 0x10),
      micMuted: !!(plug & 0x04),
      profile: u8(48) & 0x0f,
      triggerLevel: u8(49),
    },
    reportId,
    raw: new Uint8Array(d.buffer, d.byteOffset, d.byteLength),
    t,
  }
}
