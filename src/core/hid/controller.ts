import type { Touch } from './sony/touch'
import type { Vec3 } from './sony/calibration'

export type Transport = 'usb' | 'bt' | 'unknown'

export interface HidCaps {
  touchpad: boolean
  motion: boolean
  battery: boolean
  rumble: boolean
  lightbar: boolean
  lightbarFlash: boolean
  playerLeds: boolean
  micLed: boolean
  adaptiveTriggers: boolean
  /** DualSense Edge: Fn buttons, back paddles, trigger stops, active profile */
  edge: boolean
}

export interface HidState {
  /** raw 0..255 */
  sticks: { lx: number; ly: number; rx: number; ry: number }
  triggers: { l2: number; r2: number }
  buttons: Record<string, boolean>
  hat: number
  touches: Touch[]
  gyro: Vec3
  accel: Vec3
  gyroDps: Vec3
  accelG: Vec3
  sensorTs: number
  battery: { percent: number; state: 'discharging' | 'charging' | 'full' | 'unknown' }
  flags: { headphones: boolean; mic: boolean; usb: boolean }
  /** family-specific extras, e.g. trigger status nibbles */
  extra: Record<string, number | boolean>
  reportId: number
  raw: Uint8Array
  t: number
}

export type MicLedMode = 'off' | 'on' | 'pulse'

export interface HidController {
  readonly family: 'dualsense' | 'dualshock4'
  readonly label: string
  readonly caps: HidCaps
  readonly device: HIDDevice
  readonly transport: Transport
  subscribe(cb: (s: HidState) => void): () => void
  rumble(strong: number, weak: number): Promise<void>
  setLightbar(rgb: [number, number, number] | null): Promise<void>
  setLightbarFlash(onMs: number, offMs: number): Promise<void>
  setPlayerLeds(mask: number, brightness: 0 | 1 | 2): Promise<void>
  setMicLed(mode: MicLedMode): Promise<void>
  setTrigger(side: 'left' | 'right', effect: Uint8Array): Promise<void>
  info(): Promise<Record<string, string>>
  /** factory data over the vendor command channel (DualSense family) */
  factory?(): Promise<Record<string, string | number | undefined>>
  close(): Promise<void>
}

export const noop = async () => undefined
