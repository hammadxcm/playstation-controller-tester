import { FLAG0, FLAG1, FLAG2, SIZE } from './constants'

export interface DualSenseOutput {
  rumble: { strong: number; weak: number } | null
  lightbar: [number, number, number] | null
  playerLeds: { mask: number; brightness: 0 | 1 | 2 } | null
  micLed: 0 | 1 | 2 | null
  trigger: { left: Uint8Array | null; right: Uint8Array | null }
  /** send the "stop boot animation" setup bit; needed once after connect */
  lightbarSetup: boolean
  /** firmware >= 2.21 wants the v2 vibration flag */
  vibrationV2: boolean
}

export function emptyOutput(): DualSenseOutput {
  return { rumble: null, lightbar: null, playerLeds: null, micLed: null, trigger: { left: null, right: null }, lightbarSetup: false, vibrationV2: false }
}

/** Encode the 47-byte common payload, setting each valid-flag bit only for fields present. */
export function encodeOutput(o: DualSenseOutput): Uint8Array {
  const p = new Uint8Array(SIZE.outputPayload)
  if (o.rumble) {
    p[0] |= FLAG0.haptics | (o.vibrationV2 ? 0 : FLAG0.compatVibration)
    if (o.vibrationV2) p[38] |= FLAG2.compatVibration2
    p[2] = Math.round(Math.max(0, Math.min(1, o.rumble.weak)) * 255)
    p[3] = Math.round(Math.max(0, Math.min(1, o.rumble.strong)) * 255)
  }
  if (o.trigger.right) {
    p[0] |= FLAG0.rightTrigger
    p.set(o.trigger.right.subarray(0, 11), 10)
  }
  if (o.trigger.left) {
    p[0] |= FLAG0.leftTrigger
    p.set(o.trigger.left.subarray(0, 11), 21)
  }
  if (o.micLed !== null) {
    p[1] |= FLAG1.micLed
    p[8] = o.micLed
  }
  if (o.lightbar) {
    p[1] |= FLAG1.lightbar
    p[44] = o.lightbar[0]
    p[45] = o.lightbar[1]
    p[46] = o.lightbar[2]
  }
  if (o.playerLeds) {
    p[1] |= FLAG1.playerLeds
    p[42] = o.playerLeds.brightness
    p[43] = o.playerLeds.mask & 0x1f
  }
  if (o.lightbarSetup) {
    p[38] |= FLAG2.lightbarSetup
    p[41] = 0x02
  }
  return p
}

/** Player LED masks as the PS5 shows them (centre-out). */
export const PLAYER_LED = [0b00100, 0b01010, 0b10101, 0b11011, 0b11111] as const
