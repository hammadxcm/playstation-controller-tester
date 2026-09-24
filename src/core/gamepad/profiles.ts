import type { Family } from './identify'
import type { StdButton } from './types'

export interface FamilyProfile {
  label: string
  buttons: Record<StdButton, string>
  hasTouchpad: boolean
  triggerRumble: boolean
}

const ps = (label: string, touch: boolean): FamilyProfile => ({
  label,
  hasTouchpad: touch,
  triggerRumble: false,
  buttons: {
    south: '✕', east: '○', west: '□', north: '△',
    l1: 'L1', r1: 'R1', l2: 'L2', r2: 'R2',
    select: label === 'DualSense' ? 'Create' : 'Share', start: 'Options',
    l3: 'L3', r3: 'R3', up: '↑', down: '↓', left: '←', right: '→',
    home: 'PS', touchpad: 'Touchpad',
  },
})

export const PROFILES: Record<Family, FamilyProfile> = {
  dualsense: ps('DualSense', true),
  dualshock4: ps('DualShock 4', true),
  xbox: {
    label: 'Xbox',
    hasTouchpad: false,
    triggerRumble: true,
    buttons: {
      south: 'A', east: 'B', west: 'X', north: 'Y',
      l1: 'LB', r1: 'RB', l2: 'LT', r2: 'RT',
      select: 'View', start: 'Menu', l3: 'LS', r3: 'RS',
      up: '↑', down: '↓', left: '←', right: '→', home: 'Xbox', touchpad: 'Share',
    },
  },
  generic: {
    label: 'Gamepad',
    hasTouchpad: false,
    triggerRumble: false,
    buttons: {
      south: 'B0', east: 'B1', west: 'B2', north: 'B3',
      l1: 'L1', r1: 'R1', l2: 'L2', r2: 'R2',
      select: 'Select', start: 'Start', l3: 'L3', r3: 'R3',
      up: '↑', down: '↓', left: '←', right: '→', home: 'Home', touchpad: 'B17',
    },
  },
}
