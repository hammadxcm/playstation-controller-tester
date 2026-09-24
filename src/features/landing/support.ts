/** What this browser can do for the Add Device section. Pure so it is unit-tested; the UI just renders the result. */
export type Engine = 'chromium' | 'firefox' | 'safari' | 'other'
export interface Support {
  /** navigator.getGamepads exists (pad appears after its first button press) */
  gamepad: boolean
  /** navigator.hid exists (direct pairing, Chrome/Edge desktop) */
  webhid: boolean
  engine: Engine
}
export type Phase = 'unsupported' | 'waiting' | 'pairing' | 'error'

export const ENGINE_LABEL: Record<Engine, string> = {
  chromium: 'Chrome / Edge',
  firefox: 'Firefox',
  safari: 'Safari',
  other: 'this browser',
}

export const engineFor = (ua: string): Engine =>
  /firefox|fxios/i.test(ua)
    ? 'firefox'
    : /chrome|chromium|crios|edg/i.test(ua)
      ? 'chromium'
      : /safari/i.test(ua)
        ? 'safari'
        : 'other'

export const detectSupport = (
  nav: { getGamepads?: unknown; hid?: unknown },
  ua: string,
): Support => ({
  gamepad: typeof nav.getGamepads === 'function',
  webhid: nav.hid !== undefined && nav.hid !== null,
  engine: engineFor(ua),
})

/** 'detected' is deliberately not a phase: the store flips the landing away the moment a pad or HID device appears. */
export const phaseFor = (s: Support, busy: boolean, err: string): Phase =>
  !s.gamepad && !s.webhid ? 'unsupported' : err ? 'error' : busy ? 'pairing' : 'waiting'
