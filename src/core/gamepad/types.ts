export interface ButtonState {
  pressed: boolean
  value: number
}

/** One snapshot of a gamepad, copied out of the live Gamepad object. */
export interface Frame {
  index: number
  id: string
  mapping: string
  /** performance.now() when the snapshot was taken */
  t: number
  /** gamepad.timestamp; 0 where unsupported (Firefox) */
  hwT: number
  axes: readonly number[]
  buttons: readonly ButtonState[]
}

/** Indices of the W3C "standard" gamepad layout. */
export const STD = {
  south: 0,
  east: 1,
  west: 2,
  north: 3,
  l1: 4,
  r1: 5,
  l2: 6,
  r2: 7,
  select: 8,
  start: 9,
  l3: 10,
  r3: 11,
  up: 12,
  down: 13,
  left: 14,
  right: 15,
  home: 16,
  touchpad: 17,
} as const
export type StdButton = keyof typeof STD
export const STD_BUTTONS = Object.keys(STD) as StdButton[]
export const STD_AXES = ['lx', 'ly', 'rx', 'ry'] as const
