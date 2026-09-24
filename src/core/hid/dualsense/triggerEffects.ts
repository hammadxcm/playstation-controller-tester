/**
 * DualSense adaptive-trigger effect encoders (11 bytes: mode + 10 params).
 * Ported from Nielk1's TriggerEffectGenerator (MIT), revision 6.
 */
export const MODE = { off: 0x05, feedback: 0x21, weapon: 0x25, vibration: 0x26, bow: 0x22, galloping: 0x23, machine: 0x27 } as const
export type TriggerMode = keyof typeof MODE

const clampInt = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.round(v)))
const blank = (mode: number) => {
  const b = new Uint8Array(11)
  b[0] = mode
  return b
}

export function off(): Uint8Array {
  return blank(MODE.off)
}

function zones(mode: number, strengths: readonly number[], freqByte?: number): Uint8Array {
  let active = 0
  let force = 0
  for (let i = 0; i < 10; i++) {
    const s = clampInt(strengths[i] ?? 0, 0, 8)
    if (!s) continue
    active |= 1 << i
    force |= ((s - 1) & 7) << (3 * i)
  }
  if (!active) return off()
  const b = blank(mode)
  b[1] = active & 0xff
  b[2] = (active >> 8) & 0xff
  b[3] = force & 0xff
  b[4] = (force >>> 8) & 0xff
  b[5] = (force >>> 16) & 0xff
  b[6] = (force >>> 24) & 0xff
  if (freqByte !== undefined) b[9] = freqByte
  return b
}

/** Constant resistance from `position` (0–9) onward at `strength` (1–8). */
export function feedback(position: number, strength: number): Uint8Array {
  const p = clampInt(position, 0, 9)
  const s = clampInt(strength, 0, 8)
  return zones(MODE.feedback, Array.from({ length: 10 }, (_, i) => (i >= p ? s : 0)))
}

/** Per-zone strengths, 10 entries of 0–8. */
export function multiPositionFeedback(strengths: readonly number[]): Uint8Array {
  return zones(MODE.feedback, strengths)
}

/** Resistance between start (2–7) and end (start+1..8) that gives way, like a gun trigger. */
export function weapon(start: number, end: number, strength: number): Uint8Array {
  const s0 = clampInt(start, 2, 7)
  const s1 = clampInt(end, s0 + 1, 8)
  const st = clampInt(strength, 0, 8)
  if (!st) return off()
  const b = blank(MODE.weapon)
  const z = (1 << s0) | (1 << s1)
  b[1] = z & 0xff
  b[2] = (z >> 8) & 0xff
  b[3] = (st - 1) & 7
  return b
}

/** Vibrates from `position` at `amplitude` (1–8) and `frequency` Hz. */
export function vibration(position: number, amplitude: number, frequency: number): Uint8Array {
  const p = clampInt(position, 0, 9)
  const a = clampInt(amplitude, 0, 8)
  const f = clampInt(frequency, 0, 255)
  if (!a || !f) return off()
  return zones(MODE.vibration, Array.from({ length: 10 }, (_, i) => (i >= p ? a : 0)), f)
}

/** Bow: tension between start/end with a snap-back `snapForce`. */
export function bow(start: number, end: number, strength: number, snapForce: number): Uint8Array {
  const s0 = clampInt(start, 0, 8)
  const s1 = clampInt(end, s0 + 1, 8)
  const st = clampInt(strength, 0, 8)
  const sf = clampInt(snapForce, 0, 8)
  if (!st || !sf) return off()
  const b = blank(MODE.bow)
  const z = (1 << s0) | (1 << s1)
  const pair = ((st - 1) & 7) | (((sf - 1) & 7) << 3)
  b[1] = z & 0xff
  b[2] = (z >> 8) & 0xff
  b[3] = pair & 0xff
  b[4] = (pair >> 8) & 0xff
  return b
}

/** Galloping pulse pattern; only noticeable at low frequency. */
export function galloping(start: number, end: number, firstFoot: number, secondFoot: number, frequency: number): Uint8Array {
  const s0 = clampInt(start, 0, 8)
  const s1 = clampInt(end, s0 + 1, 9)
  const f1 = clampInt(firstFoot, 0, 6)
  const f2 = clampInt(secondFoot, f1 + 1, 7)
  const f = clampInt(frequency, 0, 255)
  if (!f) return off()
  const b = blank(MODE.galloping)
  const z = (1 << s0) | (1 << s1)
  b[1] = z & 0xff
  b[2] = (z >> 8) & 0xff
  b[3] = (f2 & 7) | ((f1 & 7) << 3)
  b[4] = f
  return b
}

/** Machine: alternates between two amplitudes at `frequency`, switching every `period` (×0.1 s). */
export function machine(start: number, end: number, amplitudeA: number, amplitudeB: number, frequency: number, period: number): Uint8Array {
  const s0 = clampInt(start, 0, 8)
  const s1 = clampInt(end, s0 + 1, 9)
  const a = clampInt(amplitudeA, 0, 7)
  const bAmp = clampInt(amplitudeB, 0, 7)
  const f = clampInt(frequency, 0, 255)
  if (!f) return off()
  const b = blank(MODE.machine)
  const z = (1 << s0) | (1 << s1)
  b[1] = z & 0xff
  b[2] = (z >> 8) & 0xff
  b[3] = (a & 7) | ((bAmp & 7) << 3)
  b[4] = f
  b[5] = clampInt(period, 0, 255)
  return b
}
