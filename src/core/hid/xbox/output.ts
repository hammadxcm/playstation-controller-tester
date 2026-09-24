import { byUsage, allByUsage, usage, write, type Field } from './descriptor'

/** Output report 0x03 (Chromium xbox_hid_controller.cc, Linux hid-microsoft.c, xpadneo rumble.c) */
export const RUMBLE_REPORT = 0x03
export const RUMBLE_SIZE = 8

const PID = 0x0f
const ENABLE = usage(PID, 0x97)
const MAGNITUDE = usage(PID, 0x70)
const DURATION = usage(PID, 0x50)
const START_DELAY = usage(PID, 0x7c)
const LOOP_COUNT = usage(PID, 0xa7)

export interface Rumble {
  strong: number
  weak: number
  left: number
  right: number
}
export const NO_RUMBLE: Rumble = { strong: 0, weak: 0, left: 0, right: 0 }

/** enable mask bits: 0 weak, 1 strong, 2 right trigger, 3 left trigger */
export const ENABLE_ALL = 0x0f

const pct = (v: number, max: number) => Math.round(Math.min(1, Math.max(0, v)) * max)

/**
 * Fixed layout: [enable, left, right, strong, weak, duration×10ms, delay×10ms, loops]. Some Series firmware
 * declares the last three in a different order, so when the descriptor is known, fields are written by usage.
 */
export function encodeRumble(r: Rumble, fields?: Field[]): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(RUMBLE_SIZE)
  const mags = fields ? allByUsage(fields, MAGNITUDE) : []
  if (fields && mags.length === 4 && byUsage(fields, ENABLE)) {
    const max = mags[0]!.max
    write(out, byUsage(fields, ENABLE)!, ENABLE_ALL)
    write(out, mags[0]!, pct(r.left, max))
    write(out, mags[1]!, pct(r.right, max))
    write(out, mags[2]!, pct(r.strong, max))
    write(out, mags[3]!, pct(r.weak, max))
    const dur = byUsage(fields, DURATION)
    const delay = byUsage(fields, START_DELAY)
    const loop = byUsage(fields, LOOP_COUNT)
    if (dur) write(out, dur, 0xff)
    if (delay) write(out, delay, 0)
    if (loop) write(out, loop, 0xff)
    return out
  }
  out.set([
    ENABLE_ALL,
    pct(r.left, 100),
    pct(r.right, 100),
    pct(r.strong, 100),
    pct(r.weak, 100),
    0xff,
    0,
    0xff,
  ])
  return out
}
