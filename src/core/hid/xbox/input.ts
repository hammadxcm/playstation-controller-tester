import type { HidState } from '../controller'
import { allByUsage, byUsage, read, usage, type Field } from './descriptor'

// Usage pages
const GD = 0x01
const SIM = 0x02
const BTN = 0x09
const CONSUMER = 0x0c
export const BATTERY_USAGE = usage(0x06, 0x20)

const X = usage(GD, 0x30)
const Y = usage(GD, 0x31)
const HAT = usage(GD, 0x39)
const SYS_MAIN_MENU = usage(GD, 0x85)
const ACCEL = usage(SIM, 0xc4)
const BRAKE = usage(SIM, 0xc5)
const AC_HOME = usage(CONSUMER, 0x223)
const AC_BACK = usage(CONSUMER, 0x224)
const RECORD = usage(CONSUMER, 0xb2)
const PADDLES = usage(CONSUMER, 0x81)
const PROFILE = usage(CONSUMER, 0x85)
const TRIGGER_SCALE = usage(CONSUMER, 0x99)
const btn = (n: number) => usage(BTN, n)

export const XBOX_BUTTONS = [
  'a',
  'b',
  'x',
  'y',
  'lb',
  'rb',
  'back',
  'menu',
  'ls',
  'rs',
  'xbox',
  'share',
] as const
export type XboxButton = (typeof XBOX_BUTTONS)[number]

/**
 * Two button layouts exist. Old firmware declares buttons 1..12 in Xbox order; BLE firmware 5.x
 * declares Linux gamepad codes (A=1 B=2 X=4 Y=5 LB=7 RB=8 Back=11 Menu=12 Xbox=13 LS=14 RS=15 Share=16),
 * leaving usages 3/6/9/10 unused. The gap at usage 3 tells them apart.
 */
const DENSE: Record<XboxButton, number> = {
  a: 1,
  b: 2,
  x: 3,
  y: 4,
  lb: 5,
  rb: 6,
  back: 7,
  menu: 8,
  ls: 9,
  rs: 10,
  xbox: 11,
  share: 12,
}
const SPARSE: Record<XboxButton, number> = {
  a: 1,
  b: 2,
  x: 4,
  y: 5,
  lb: 7,
  rb: 8,
  back: 11,
  menu: 12,
  xbox: 13,
  ls: 14,
  rs: 15,
  share: 16,
}

export type Layout = 'dense' | 'sparse'
/** Sparse descriptors declare buttons 1..16 as one range; dense ones stop at 12 (Elite 2 adds copies from 16 up). */
export const layoutOf = (fs: Field[]): Layout =>
  [13, 14, 15].every((n) => byUsage(fs, btn(n))) ? 'sparse' : 'dense'

export interface XboxMap {
  layout: Layout
  lx?: Field
  ly?: Field
  rx?: Field
  ry?: Field
  lt?: Field
  rt?: Field
  hat?: Field
  buttons: Partial<Record<XboxButton, Field[]>>
  paddles?: Field
  profile?: Field
  triggerScale?: Field
}

/**
 * Resolve axes by size rather than by usage name: firmware disagrees on whether Z/Rz are the right stick
 * or the triggers, but sticks are always 16-bit and triggers 10-bit (or on the Simulation page).
 */
export function mapFields(fs: Field[]): XboxMap {
  const layout = layoutOf(fs)
  const gd = [0x32, 0x33, 0x34, 0x35]
    .map((u) => byUsage(fs, usage(GD, u)))
    .filter((f): f is Field => !!f)
  const sticks = gd.filter((f) => f.max > 1023)
  const small = gd.filter((f) => f.max <= 1023)
  const names = layout === 'sparse' ? SPARSE : DENSE
  const buttons: XboxMap['buttons'] = {}
  for (const k of XBOX_BUTTONS) {
    const f = byUsage(fs, btn(names[k]))
    if (f) buttons[k] = [f]
  }
  const alias = (k: XboxButton, ...us: number[]) => {
    const extra = us.map((u) => byUsage(fs, u)).filter((f): f is Field => !!f)
    if (extra.length) buttons[k] = [...(buttons[k] ?? []), ...extra]
  }
  alias('xbox', AC_HOME, SYS_MAIN_MENU)
  alias('back', AC_BACK)
  alias('share', RECORD)
  return {
    layout,
    lx: byUsage(fs, X),
    ly: byUsage(fs, Y),
    rx: sticks[0],
    ry: sticks[1],
    lt: byUsage(fs, BRAKE) ?? small[0],
    rt: byUsage(fs, ACCEL) ?? small[1],
    hat: byUsage(fs, HAT),
    buttons,
    paddles: byUsage(fs, PADDLES),
    profile: byUsage(fs, PROFILE),
    triggerScale: byUsage(fs, TRIGGER_SCALE),
  }
}

export const hasBattery = (fs: Field[]): boolean => allByUsage(fs, BATTERY_USAGE).length > 0

const to255 = (d: DataView, f: Field): number => Math.round((read(d, f) * 255) / f.max)

export function emptyState(t: number): HidState {
  return {
    sticks: { lx: 128, ly: 128, rx: 128, ry: 128 },
    triggers: { l2: 0, r2: 0 },
    buttons: {},
    hat: 8,
    touches: [],
    gyro: [0, 0, 0],
    accel: [0, 0, 0],
    gyroDps: [0, 0, 0],
    accelG: [0, 0, 0],
    sensorTs: 0,
    battery: { percent: 0, state: 'unknown' },
    flags: { headphones: false, mic: false, usb: false },
    extra: {},
    reportId: 0,
    raw: new Uint8Array(0),
    t,
  }
}

/** Fold one input report into the previous state; fields the report lacks keep their last value. */
export function parseXbox(
  m: XboxMap,
  d: DataView,
  prev: HidState,
  reportId: number,
  t: number,
): HidState {
  const s: HidState = {
    ...prev,
    sticks: { ...prev.sticks },
    triggers: { ...prev.triggers },
    buttons: { ...prev.buttons },
    extra: { ...prev.extra },
    reportId,
    raw: new Uint8Array(d.buffer, d.byteOffset, d.byteLength),
    t,
  }
  if (m.lx) s.sticks.lx = to255(d, m.lx)
  if (m.ly) s.sticks.ly = to255(d, m.ly)
  if (m.rx) s.sticks.rx = to255(d, m.rx)
  if (m.ry) s.sticks.ry = to255(d, m.ry)
  if (m.lt) s.triggers.l2 = to255(d, m.lt)
  if (m.rt) s.triggers.r2 = to255(d, m.rt)
  if (m.hat) {
    const v = read(d, m.hat)
    s.hat = v < m.hat.min || v > m.hat.max ? 8 : v - m.hat.min
  }
  for (const k of XBOX_BUTTONS) {
    const fs = m.buttons[k]
    if (fs) s.buttons[k] = fs.some((f) => read(d, f) !== 0)
  }
  if (m.paddles) {
    // xpadneo: bit0 P1 (right upper), bit1 P2 (right lower), bit2 P3 (left upper), bit3 P4 (left lower)
    const v = read(d, m.paddles)
    for (let i = 0; i < 4; i++) s.buttons[`p${i + 1}`] = ((v >> i) & 1) === 1
  }
  if (m.profile) s.extra.profile = read(d, m.profile)
  if (m.triggerScale) s.extra.triggerScale = read(d, m.triggerScale)
  s.extra.layout = m.layout === 'sparse'
  return s
}

/**
 * Battery byte (xpadneo power.c): bit7 online, bits3:2 source (0 USB, 1 battery, 2 Play & Charge kit),
 * bit4 charging, bits1:0 level 0..3. The pad only reports four levels.
 */
export function parseBattery(b: number): { battery: HidState['battery']; usb: boolean } {
  const online = (b & 0x80) !== 0
  const mode = (b >> 2) & 0x03
  const charging = (b & 0x10) !== 0
  const level = b & 0x03
  // ponytail: four coarse steps; the hardware gives nothing finer over Bluetooth
  const percent = [10, 40, 70, 100][level]!
  if (!online) return { battery: { percent: 0, state: 'unknown' }, usb: false }
  const state = charging ? 'charging' : mode === 0 ? 'full' : 'discharging'
  return { battery: { percent, state }, usb: mode === 0 || charging }
}
