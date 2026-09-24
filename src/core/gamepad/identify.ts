export type Family = 'dualsense' | 'dualshock4' | 'xbox' | 'generic'

export interface ControllerProfile {
  family: Family
  name: string
  vid?: number
  pid?: number
}

export const SONY = 0x054c
export const MICROSOFT = 0x045e
/** Bluetooth product ids of Xbox pads (USB uses GIP, not HID, so it never reaches WebHID). Sources: Chromium gamepad_id_list, xpadneo. */
export const XBOX_BT_PID: Record<number, string> = {
  0x02e0: 'Xbox One S',
  0x02fd: 'Xbox One S',
  0x0b05: 'Xbox Elite Series 2',
  0x0b0c: 'Xbox Adaptive Controller',
  0x0b13: 'Xbox Wireless Controller',
  0x0b20: 'Xbox One S',
  0x0b22: 'Xbox Elite Series 2',
}
export const PID = {
  dualsense: 0x0ce6,
  dualsenseEdge: 0x0df2,
  ds4v1: 0x05c4,
  ds4v2: 0x09cc,
  ds4dongle: 0x0ba0,
} as const

const CHROMIUM = /vendor:\s*([0-9a-f]{4})\s*product:\s*([0-9a-f]{4})/i
const FIREFOX = /^([0-9a-f]{1,4})-([0-9a-f]{1,4})-(.*)$/i

export function familyFor(vid?: number, pid?: number, name = ''): Family {
  if (vid === SONY) {
    if (pid === PID.dualsense || pid === PID.dualsenseEdge) return 'dualsense'
    if (pid === PID.ds4v1 || pid === PID.ds4v2 || pid === PID.ds4dongle) return 'dualshock4'
  }
  if (vid === MICROSOFT) return 'xbox'
  if (/xbox|x-box|xinput/i.test(name)) return 'xbox'
  if (/dualsense/i.test(name)) return 'dualsense'
  if (/dualshock|wireless controller/i.test(name)) return 'dualshock4'
  return 'generic'
}

/** Parse Gamepad.id (browser-specific, unspecified) into vendor/product/name. */
export function identify(id: string): ControllerProfile {
  let vid: number | undefined
  let pid: number | undefined
  let name = id
  const c = CHROMIUM.exec(id)
  const f = FIREFOX.exec(id)
  if (c) {
    vid = parseInt(c[1]!, 16)
    pid = parseInt(c[2]!, 16)
    name = id.replace(/\s*\(.*\)\s*$/, '')
  } else if (f) {
    vid = parseInt(f[1]!, 16)
    pid = parseInt(f[2]!, 16)
    name = f[3]!
  } else {
    name = id.replace(/\s*extended gamepad$/i, '')
  }
  return { family: familyFor(vid, pid, name), name: name.trim() || 'Gamepad', vid, pid }
}
