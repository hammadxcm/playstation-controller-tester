export type Vec3 = [number, number, number]

export interface Calibration {
  gyroBias: Vec3
  gyroNumer: Vec3
  gyroDenom: Vec3
  accelBias: Vec3
  accelRange: Vec3
}

const S16_MAX = 32767

/**
 * Parse a Sony calibration feature report (DualSense 0x05; DS4 0x02 USB / 0x05 BT).
 * `data` may or may not carry the report-id byte first; pass `off` accordingly.
 * DS4 over BT groups gyro plus/minus by sign instead of interleaving by axis.
 */
export function parseCalibration(d: DataView, off: number, grouped = false): Calibration {
  const i16 = (o: number) => d.getInt16(off + o, true)
  const bias: Vec3 = [i16(0), i16(2), i16(4)]
  const plus: Vec3 = grouped ? [i16(6), i16(8), i16(10)] : [i16(6), i16(10), i16(14)]
  const minus: Vec3 = grouped ? [i16(12), i16(14), i16(16)] : [i16(8), i16(12), i16(16)]
  const speed2x = i16(18) + i16(20)
  const acc: number[] = [i16(22), i16(24), i16(26), i16(28), i16(30), i16(32)]
  const gyroNumer: Vec3 = [0, 0, 0]
  const gyroDenom: Vec3 = [0, 0, 0]
  const accelBias: Vec3 = [0, 0, 0]
  const accelRange: Vec3 = [0, 0, 0]
  for (let a = 0; a < 3; a++) {
    const denom = Math.abs(plus[a]! - bias[a]!) + Math.abs(minus[a]! - bias[a]!)
    gyroNumer[a] = denom ? speed2x : S16_MAX
    gyroDenom[a] = denom || S16_MAX
    const p = acc[a * 2]!
    const m = acc[a * 2 + 1]!
    const range = p - m
    accelRange[a] = range || S16_MAX
    accelBias[a] = range ? p - range / 2 : 0
  }
  return { gyroBias: bias, gyroNumer, gyroDenom, accelBias, accelRange }
}

/** Raw sensor counts → degrees/second and g. Falls back to datasheet defaults without calibration. */
export function applyCalibration(
  gyro: Vec3,
  accel: Vec3,
  cal: Calibration | null,
  defaults: { gyroPerDps: number; accelPerG: number },
): { gyroDps: Vec3; accelG: Vec3 } {
  if (!cal) {
    return {
      gyroDps: gyro.map((v) => v / defaults.gyroPerDps) as Vec3,
      accelG: accel.map((v) => v / defaults.accelPerG) as Vec3,
    }
  }
  return {
    gyroDps: gyro.map((v, a) => (cal.gyroNumer[a]! * (v - cal.gyroBias[a]!)) / cal.gyroDenom[a]!) as Vec3,
    accelG: accel.map((v, a) => (2 * (v - cal.accelBias[a]!)) / cal.accelRange[a]!) as Vec3,
  }
}
