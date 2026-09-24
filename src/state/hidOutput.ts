import type { AudioSettings, HidController, MicLedMode } from '@/core/hid/controller'
import { fx } from './fx'

export type RGB = [number, number, number]

/** What the app last told the controller to do; the model draws this. */
export interface HidOutput {
  lightbar: RGB | null
  flash: { onMs: number; offMs: number } | null
  playerLeds: { mask: number; brightness: 0 | 1 | 2 }
  micLed: MicLedMode
  trigger: { left: number; right: number } // effect mode byte, 0x05 = off
  rumble: { strong: number; weak: number }
  audio: AudioSettings | null
}

export const EMPTY_OUTPUT: HidOutput = {
  lightbar: null,
  flash: null,
  playerLeds: { mask: 0, brightness: 0 },
  micLed: 'off',
  trigger: { left: 0x05, right: 0x05 },
  rumble: { strong: 0, weak: 0 },
  audio: null,
}

/** Wrap a controller so every command is mirrored into `set` after the device accepted it. */
export function trackOutput(hid: HidController, set: (patch: Partial<HidOutput>) => void, get: () => HidOutput): HidController {
  return {
    family: hid.family,
    label: hid.label,
    caps: hid.caps,
    device: hid.device,
    get transport() {
      return hid.transport
    },
    subscribe: (cb) => hid.subscribe(cb),
    async rumble(strong, weak) {
      await hid.rumble(strong, weak)
      set({ rumble: { strong, weak } })
      if (strong || weak) fx.emit('rumble', { strong, weak, lt: 0, rt: 0, durationMs: 0 })
      else fx.emit('stop', undefined)
    },
    async setLightbar(rgb) {
      await hid.setLightbar(rgb)
      set({ lightbar: rgb })
    },
    async setLightbarFlash(onMs, offMs) {
      await hid.setLightbarFlash(onMs, offMs)
      set({ flash: onMs || offMs ? { onMs, offMs } : null })
    },
    async setPlayerLeds(mask, brightness) {
      await hid.setPlayerLeds(mask, brightness)
      set({ playerLeds: { mask, brightness } })
    },
    async setMicLed(mode) {
      await hid.setMicLed(mode)
      set({ micLed: mode })
    },
    async setTrigger(side, effect) {
      await hid.setTrigger(side, effect)
      set({ trigger: { ...get().trigger, [side]: effect[0] ?? 0x05 } })
    },
    setAudio: hid.setAudio ? async (a) => { await hid.setAudio!(a); set({ audio: a }) } : undefined,
    info: () => hid.info(),
    factory: hid.factory ? () => hid.factory!() : undefined,
    close: () => hid.close(),
  }
}
