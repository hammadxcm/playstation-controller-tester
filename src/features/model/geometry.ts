import type { Family } from '@/core/gamepad/identify'

export type XY = [number, number]
export type Rect = [number, number, number, number]
export type FaceKey = 'north' | 'south' | 'east' | 'west'

/** Everything the shared part renderer needs; shells are drawn separately per family. */
export interface ControllerGeometry {
  ls: XY
  rs: XY
  stickR: number
  face: {
    c: XY
    d: number
    r: number
    glyph: Record<FaceKey, string>
    color: Record<FaceKey, string>
  }
  dpad: { c: XY; style: 'cross' | 'dish' }
  l1: Rect
  r1: Rect
  l2: Rect
  r2: Rect
  select: XY
  start: XY
  home: XY
  /** DualSense mute / Xbox share (std index 17 on Xbox) */
  aux?: XY
  touchpad?: Rect
  lightbar?: { kind: 'strips'; left: string; right: string } | { kind: 'top'; d: string }
  leds?: XY[]
  mic?: XY
  grips: { left: XY; right: XY }
  impulseTriggers: boolean
  labels: {
    select: string
    start: string
    home: string
    aux?: string
    l1: string
    r1: string
    l2: string
    r2: string
  }
}

const PS_GLYPH = { north: '△', south: '✕', east: '○', west: '□' }
const PS_COLOR = { north: '#39c98a', south: '#5a8dff', east: '#ff5f5f', west: '#f272c9' }
const XB_GLYPH = { north: 'Y', south: 'A', east: 'B', west: 'X' }
const XB_COLOR = { north: '#f4c542', south: '#6ccf4a', east: '#f05a5a', west: '#4a90e2' }
const NEUTRAL = { north: '#b9a6ff', south: '#b9a6ff', east: '#b9a6ff', west: '#b9a6ff' }

const DUALSENSE: ControllerGeometry = {
  ls: [150, 154],
  rs: [250, 154],
  stickR: 23,
  face: { c: [304, 104], d: 21, r: 11, glyph: PS_GLYPH, color: PS_COLOR },
  dpad: { c: [96, 104], style: 'cross' },
  l1: [70, 22, 64, 12],
  r1: [266, 22, 64, 12],
  l2: [82, 4, 44, 14],
  r2: [274, 4, 44, 14],
  select: [128, 66],
  start: [272, 66],
  home: [200, 172],
  aux: [200, 196],
  touchpad: [148, 54, 104, 72],
  lightbar: {
    kind: 'strips',
    left: 'M146,58 C140,80 140,104 146,126',
    right: 'M254,58 C260,80 260,104 254,126',
  },
  leds: [
    [184, 134],
    [192, 134],
    [200, 134],
    [208, 134],
    [216, 134],
  ],
  mic: [200, 186],
  grips: { left: [62, 204], right: [338, 204] },
  impulseTriggers: false,
  labels: {
    select: 'Create',
    start: 'Options',
    home: 'PS',
    aux: 'Mute',
    l1: 'L1',
    r1: 'R1',
    l2: 'L2',
    r2: 'R2',
  },
}

const DUALSHOCK4: ControllerGeometry = {
  ...DUALSENSE,
  ls: [150, 150],
  rs: [250, 150],
  face: { ...DUALSENSE.face, c: [304, 102] },
  dpad: { c: [96, 102], style: 'cross' },
  select: [128, 74],
  start: [272, 74],
  home: [200, 168],
  aux: undefined,
  touchpad: [150, 52, 100, 62],
  lightbar: { kind: 'top', d: 'M160,46 Q200,40 240,46 L240,52 Q200,47 160,52 Z' },
  leds: undefined,
  mic: undefined,
  labels: { select: 'Share', start: 'Options', home: 'PS', l1: 'L1', r1: 'R1', l2: 'L2', r2: 'R2' },
}

const XBOX: ControllerGeometry = {
  ls: [98, 98],
  rs: [252, 150],
  stickR: 24,
  face: { c: [302, 98], d: 21, r: 11, glyph: XB_GLYPH, color: XB_COLOR },
  dpad: { c: [148, 150], style: 'dish' },
  l1: [66, 22, 70, 12],
  r1: [264, 22, 70, 12],
  l2: [78, 4, 46, 14],
  r2: [276, 4, 46, 14],
  select: [166, 98],
  start: [234, 98],
  home: [200, 60],
  aux: [200, 118],
  grips: { left: [60, 204], right: [340, 204] },
  impulseTriggers: true,
  labels: {
    select: 'View',
    start: 'Menu',
    home: 'Xbox',
    aux: 'Share',
    l1: 'LB',
    r1: 'RB',
    l2: 'LT',
    r2: 'RT',
  },
}

const GENERIC: ControllerGeometry = {
  ...DUALSHOCK4,
  face: {
    ...DUALSHOCK4.face,
    glyph: { north: '3', south: '0', east: '1', west: '2' },
    color: NEUTRAL,
  },
  touchpad: undefined,
  lightbar: undefined,
  labels: {
    select: 'Select',
    start: 'Start',
    home: 'Home',
    l1: 'L1',
    r1: 'R1',
    l2: 'L2',
    r2: 'R2',
  },
}

export const GEOMETRY: Record<Family, ControllerGeometry> = {
  dualsense: DUALSENSE,
  dualshock4: DUALSHOCK4,
  xbox: XBOX,
  generic: GENERIC,
}
