import { FLAG } from './constants'

export interface DualShock4Output {
  rumble: { strong: number; weak: number } | null
  lightbar: [number, number, number] | null
  flash: { onMs: number; offMs: number } | null
}

const to255 = (v: number) => Math.round(Math.max(0, Math.min(1, v)) * 255)

/** 10-byte common block: flag0 flag1 pad motorR motorL R G B blinkOn blinkOff. */
export function encodeOutput(o: DualShock4Output): Uint8Array {
  const p = new Uint8Array(10)
  if (o.rumble) {
    p[0] = p[0]! | (FLAG.rumble)
    p[3] = to255(o.rumble.weak)
    p[4] = to255(o.rumble.strong)
  }
  if (o.lightbar) {
    p[0] = p[0]! | (FLAG.lightbar)
    p[5] = o.lightbar[0]
    p[6] = o.lightbar[1]
    p[7] = o.lightbar[2]
  }
  if (o.flash) {
    p[0] = p[0]! | (FLAG.flash)
    p[8] = Math.min(255, Math.round(o.flash.onMs / 10))
    p[9] = Math.min(255, Math.round(o.flash.offMs / 10))
  }
  return p
}
