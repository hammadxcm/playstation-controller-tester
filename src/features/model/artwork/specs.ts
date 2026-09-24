import type { StdButton } from '@/core/gamepad/types'

export type ArtworkKind = 'dualsense' | 'dualshock4' | 'dualsenseEdge'

/**
 * How to turn one of daidr's controller drawings (MIT, © Xuezhou Dai) into a rig-driven model.
 * `stroke` art is line work (DualSense); `fill` art is filled outlines with hidden `Active_*` shapes (DS4, Edge).
 */
export interface ArtworkSpec {
  kind: ArtworkKind
  style: 'stroke' | 'fill'
  /** standard button → element ids that light up */
  parts: Partial<Record<StdButton, string[]>>
  /** extra HID-only buttons (from Pro Mode state) → element ids */
  extra: Record<string, string[]>
  sticks: { ls: { wrap?: string; cap: string }; rs: { wrap?: string; cap: string } }
  /** cap travel at full deflection, in viewBox units */
  travel: number
  /** element ids to drop (placeholders) */
  remove: string[]
  /** element ids whose bounding boxes place the overlay */
  anchors: { touchpad: string; mute?: string; gripL?: string; gripR?: string }
  lightbar: 'strips' | 'top' | 'none'
  leds: boolean
}

export const SPECS: Record<ArtworkKind, ArtworkSpec> = {
  dualsense: {
    kind: 'dualsense',
    style: 'stroke',
    parts: {
      south: ['cross'], east: ['circle'], west: ['rect'], north: ['triangle'],
      up: ['dpad-up'], down: ['dpad-down'], left: ['dpad-left'], right: ['dpad-right'],
      l1: ['l1'], r1: ['r1'], l2: ['l2'], r2: ['r2'],
      select: ['create'], start: ['options'], home: ['ps'], touchpad: ['touchpad'],
    },
    extra: { mute: ['mute'] },
    sticks: { ls: { wrap: 'l3group', cap: 'l3' }, rs: { wrap: 'r3group', cap: 'r3' } },
    travel: 86,
    remove: ['画板1', 't1', 't2'],
    anchors: { touchpad: 'touchpad', mute: 'mute', gripL: 'left-hat', gripR: 'right-hat' },
    lightbar: 'strips',
    leds: true,
  },
  dualshock4: {
    kind: 'dualshock4',
    style: 'fill',
    parts: {
      south: ['Active_Cross'], east: ['Active_Circle'], west: ['Active_Square'], north: ['Active_Triangle'],
      up: ['Active_DPadTop'], down: ['Active_DPadBottom'], left: ['Active_DPadLeft'], right: ['Active_DPadRight'],
      l1: ['Active_L1'], r1: ['Active_R1'], l2: ['Active_LT'], r2: ['Active_RT'],
      select: ['Active_Share'], start: ['Active_Options'], home: ['Active_PS'], touchpad: ['Active_TouchPad'],
    },
    extra: {},
    sticks: { ls: { cap: 'Active_LS' }, rs: { cap: 'Active_RS' } },
    travel: 62,
    remove: ['DualShock'],
    anchors: { touchpad: 'Active_TouchPad', gripL: 'LeftBorder', gripR: 'RightBorder' },
    lightbar: 'top',
    leds: false,
  },
  dualsenseEdge: {
    kind: 'dualsenseEdge',
    style: 'fill',
    parts: {
      south: ['Active_Cross'], east: ['Active_Circle'], west: ['Active_Square'], north: ['Active_Triangle'],
      up: ['ActiveDPad'], right: ['ActiveDPad2'], down: ['ActiveDPad1'], left: ['ActiveDPad3'],
      l1: ['Active_L1'], r1: ['Active_L2'], l2: ['Active_LT'], r2: ['Active_RT'],
      select: ['Active_Create'], start: ['Active_Option'], home: ['Active_PS'], touchpad: ['Touchpad'],
    },
    extra: { mute: ['Active_Mute'], fnL: ['Active_LFn'], fnR: ['Active_RFn'], paddleL: ['Active_LBack'], paddleR: ['Active_RBack'] },
    sticks: { ls: { cap: 'Active_LS' }, rs: { cap: 'Active_RS' } },
    travel: 62,
    remove: ['DualSenseEdge'],
    anchors: { touchpad: 'Touchpad', mute: 'Active_Mute', gripL: 'Border', gripR: 'Border' },
    lightbar: 'strips',
    leds: true,
  },
}

export const ART_FILES: Record<ArtworkKind, () => Promise<{ default: string }>> = {
  dualsense: () => import('./dualsense.svg?raw'),
  dualshock4: () => import('./dualshock4.svg?raw'),
  dualsenseEdge: () => import('./dualsenseEdge.svg?raw'),
}
