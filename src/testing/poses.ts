import { STD } from '@/core/gamepad/types'

export interface Pose {
  axes: [number, number, number, number]
  /** std index → value (1 = pressed) */
  buttons: Partial<Record<number, number>>
}

export const POSES: Record<string, Pose> = {
  idle: { axes: [0, 0, 0, 0], buttons: {} },
  'press-south': { axes: [0, 0, 0, 0], buttons: { [STD.south]: 1 } },
  'sticks-diag': { axes: [0.7, -0.7, -0.5, 0.5], buttons: {} },
  'triggers-half': { axes: [0, 0, 0, 0], buttons: { [STD.l2]: 0.5, [STD.r2]: 0.9 } },
  'dpad-up': { axes: [0, 0, 0, 0], buttons: { [STD.up]: 1, [STD.l1]: 1 } },
  all: {
    axes: [1, 0, 0, -1],
    buttons: Object.fromEntries(Array.from({ length: 18 }, (_, i) => [i, 1])),
  },
}
