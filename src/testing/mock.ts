/**
 * Headless test harness. Loaded only in dev builds (`pnpm dev`) with `?mock=<family>`; tree-shaken out of production.
 * Params: mock=dualsense|dualshock4|xbox|generic|none (none: no fake pad, landing stays up), edge=1 (HID mock reports DualSense Edge), pose=<name>, anim=1, hid=1, unmapped=1, theme=light,
 *         lb=rrggbb, leds=P1..P5|mask:N, mic=off|on|pulse, flash=on,off, trig=left:feedback
 */
import { POSES, type Pose } from './poses'
import { fx } from '@/state/fx'
import { perf } from '@/lib/motion'
import { useStore } from '@/state/store'

const q = new URLSearchParams(location.search)
const family = q.get('mock') || 'dualsense'
const IDS: Record<string, string> = {
  dualsense: 'DualSense Wireless Controller (STANDARD GAMEPAD Vendor: 054c Product: 0ce6)',
  dualshock4: 'Wireless Controller (STANDARD GAMEPAD Vendor: 054c Product: 09cc)',
  xbox: 'Xbox Wireless Controller (STANDARD GAMEPAD Vendor: 045e Product: 0b12)',
  generic: 'USB Joystick (STANDARD GAMEPAD Vendor: 2dc8 Product: 6001)',
}

const gp = {
  index: 0,
  id: IDS[family] ?? IDS.generic!,
  mapping: q.has('unmapped') ? '' : 'standard',
  connected: true,
  timestamp: 0,
  axes: [0, 0, 0, 0] as number[],
  buttons: Array.from({ length: 18 }, () => ({ pressed: false, touched: false, value: 0 })),
  vibrationActuator: {
    effects:
      family === 'xbox' || family === 'dualsense'
        ? ['dual-rumble', 'trigger-rumble']
        : ['dual-rumble'],
    playEffect: async () => 'complete',
    reset: async () => undefined,
  },
}
if (family !== 'none') navigator.getGamepads = () => [gp as unknown as Gamepad, null, null, null]

function setPose(p: Pose) {
  gp.axes = [...p.axes]
  gp.buttons = gp.buttons.map((_, i) => {
    const v = p.buttons[i] ?? 0
    return { pressed: v >= 0.5 || (v > 0 && i !== 6 && i !== 7), touched: v > 0, value: v }
  })
  gp.timestamp = performance.now()
}
setPose(POSES[q.get('pose') ?? 'idle'] ?? POSES.idle!)

let timer = 0
if (q.has('anim')) {
  const t0 = performance.now()
  timer = window.setInterval(() => {
    const t = (performance.now() - t0) / 1000
    const r = 0.98 + (Math.round(t * 50) % 3) * 0.004
    setPose({
      axes: [
        Math.round(Math.cos(t * 2) * r * 127) / 127,
        Math.round(Math.sin(t * 2) * r * 127) / 127,
        Math.sin(t) * 0.5 + 0.03,
        Math.cos(t * 1.3) * 0.5,
      ],
      buttons: {
        0: Math.floor(t * 2) % 2 === 0 ? 1 : 0,
        12: Math.floor(t) % 3 === 0 ? 1 : 0,
        7: (Math.sin(t) + 1) / 2,
        6: 0.3,
        4: 1,
      },
    })
  }, 4)
}
const theme = q.get('theme')
if (theme === 'light' || theme === 'dark') useStore.getState().setSettings({ theme })

async function settle() {
  for (const a of document.getAnimations()) {
    try {
      if (a.effect && (a.effect.getTiming().iterations ?? 1) !== Infinity) a.finish()
    } catch {
      /* ignore */
    }
  }
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
}

const ct = {
  store: useStore,
  fx,
  gp,
  pose(name: string | Pose) {
    setPose(typeof name === 'string' ? (POSES[name] ?? POSES.idle!) : name)
  },
  stop() {
    clearInterval(timer)
  },
  settle,
  stats: () => perf.stats(),
  resetStats: () => perf.reset(),
  hid: null as unknown,
}
;(window as unknown as { __ct: typeof ct }).__ct = ct

if (q.has('hid')) {
  const { installMockHid } = await import('./mockHid')
  ct.hid = await installMockHid(family, q)
}
