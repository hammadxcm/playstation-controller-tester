import type { HidState } from '../controller'
import { applyCalibration, type Calibration, type Vec3 } from '../sony/calibration'
import { decodeTouch } from '../sony/touch'
import { SENSOR, TOUCHPAD } from './constants'

/** Parse DualShock 4 state starting at `off` (USB 0, BT 2). */
export function parseDualShock4(d: DataView, off: number, cal: Calibration | null, t: number, reportId: number): HidState {
  const u8 = (o: number) => d.getUint8(off + o)
  const i16 = (o: number) => d.getInt16(off + o, true)
  const b0 = u8(4)
  const b1 = u8(5)
  const b2 = u8(6)
  const gyro: Vec3 = [i16(12), i16(14), i16(16)]
  const accel: Vec3 = [i16(18), i16(20), i16(22)]
  const bat = u8(29)
  const level = bat & 0x0f
  const cable = !!(bat & 0x10)
  const touches = []
  const touchCount = d.byteLength > off + 33 ? u8(32) : 0
  if (touchCount > 0 && d.byteLength >= off + 42) {
    touches.push(decodeTouch(d, off + 34, TOUCHPAD.width, TOUCHPAD.height), decodeTouch(d, off + 38, TOUCHPAD.width, TOUCHPAD.height))
  }
  return {
    sticks: { lx: u8(0), ly: u8(1), rx: u8(2), ry: u8(3) },
    triggers: { l2: u8(7), r2: u8(8) },
    hat: b0 & 0x0f,
    buttons: {
      square: !!(b0 & 0x10), cross: !!(b0 & 0x20), circle: !!(b0 & 0x40), triangle: !!(b0 & 0x80),
      l1: !!(b1 & 0x01), r1: !!(b1 & 0x02), l2: !!(b1 & 0x04), r2: !!(b1 & 0x08),
      share: !!(b1 & 0x10), options: !!(b1 & 0x20), l3: !!(b1 & 0x40), r3: !!(b1 & 0x80),
      ps: !!(b2 & 0x01), touchpad: !!(b2 & 0x02),
    },
    touches,
    gyro,
    accel,
    ...applyCalibration(gyro, accel, cal, SENSOR),
    sensorTs: (d.getUint16(off + 9, true) * 16) / 3,
    battery: {
      percent: level >= 11 ? 100 : Math.min(level * 10 + 5, 100),
      state: cable ? (level >= 11 ? 'full' : 'charging') : 'discharging',
    },
    flags: { headphones: false, mic: false, usb: cable },
    extra: { counter: b2 >> 2, temperature: u8(11), touchReports: touchCount },
    reportId,
    raw: new Uint8Array(d.buffer, d.byteOffset, d.byteLength),
    t,
  }
}
