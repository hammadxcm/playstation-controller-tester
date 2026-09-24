import type { HidController, HidState, MicLedMode } from '@/core/hid/controller'
import { PLAYER_LED } from '@/core/hid/dualsense/output'
import { useStore } from '@/state/store'
import { POSES } from './poses'

const DS_CAPS = {
  touchpad: true,
  motion: true,
  battery: true,
  rumble: true,
  lightbar: true,
  lightbarFlash: false,
  playerLeds: true,
  micLed: true,
  adaptiveTriggers: true,
  edge: false,
}
const DS4_CAPS = {
  ...DS_CAPS,
  lightbarFlash: true,
  playerLeds: false,
  micLed: false,
  adaptiveTriggers: false,
}
const to255 = (v: number) => Math.round((v + 1) * 127.5)

export interface MockHid extends HidController {
  out: Record<string, unknown>
  state(): HidState
}

/** In-memory HidController that produces synthetic state and records every command. */
export function createMockHid(family: string, edge = false): MockHid {
  const ds4 = family === 'dualshock4'
  const listeners = new Set<(s: HidState) => void>()
  const out: Record<string, unknown> = {}
  let engaged = { left: false, right: false }
  const t0 = performance.now()
  let last: HidState | null = null

  const state = (): HidState => {
    const gp = (
      window as unknown as {
        __ct: { gp: { axes: number[]; buttons: { value: number; pressed: boolean }[] } }
      }
    ).__ct.gp
    const t = (performance.now() - t0) / 1000
    const b = gp.buttons
    const names = ds4
      ? [
          'cross',
          'circle',
          'square',
          'triangle',
          'l1',
          'r1',
          'l2',
          'r2',
          'share',
          'options',
          'l3',
          'r3',
          'up',
          'down',
          'left',
          'right',
          'ps',
          'touchpad',
        ]
      : [
          'cross',
          'circle',
          'square',
          'triangle',
          'l1',
          'r1',
          'l2',
          'r2',
          'create',
          'options',
          'l3',
          'r3',
          'up',
          'down',
          'left',
          'right',
          'ps',
          'touchpad',
          'mute',
        ]
    const buttons = Object.fromEntries(names.map((n, i) => [n, !!b[i]?.pressed]))
    return {
      sticks: {
        lx: to255(gp.axes[0]!),
        ly: to255(gp.axes[1]!),
        rx: to255(gp.axes[2]!),
        ry: to255(gp.axes[3]!),
      },
      triggers: { l2: Math.round(b[6]!.value * 255), r2: Math.round(b[7]!.value * 255) },
      buttons,
      hat: 8,
      touches: [
        { id: 3, active: true, x: 0.5 + 0.3 * Math.cos(t), y: 0.5 + 0.3 * Math.sin(t) },
        { id: 4, active: t % 4 < 2, x: 0.3, y: 0.6 },
      ],
      gyro: [0, 0, 0],
      accel: [0, 8192, 0],
      gyroDps: [0, 0, 0],
      accelG: [0.25 * Math.sin(t * 0.7), 0.95, 0.2 * Math.cos(t * 0.5)],
      sensorTs: t * 1e6,
      battery: { percent: 75, state: 'discharging' },
      flags: { headphones: false, mic: false, usb: true },
      extra: {
        seq: Math.floor(t * 250) & 0xff,
        l2Status: engaged.left ? 1 : 0,
        l2Engaged: engaged.left,
        r2Status: engaged.right ? 1 : 0,
        r2Engaged: engaged.right,
        micMuted: false,
      },
      reportId: 1,
      raw: new Uint8Array(64),
      t: performance.now(),
    }
  }
  const timer = setInterval(() => {
    last = state()
    listeners.forEach((l) => l(last!))
  }, 4)
  const rec =
    (k: string) =>
    async (...v: unknown[]) => {
      out[k] = v
    }
  return {
    family: ds4 ? 'dualshock4' : 'dualsense',
    label: ds4 ? 'DualShock 4 (mock)' : edge ? 'DualSense Edge (mock)' : 'DualSense (mock)',
    caps: ds4 ? DS4_CAPS : edge ? { ...DS_CAPS, edge: true } : DS_CAPS,
    transport: 'usb',
    device: {
      opened: true,
      vendorId: 0x054c,
      productId: ds4 ? 0x09cc : 0x0ce6,
      productName: 'mock',
    } as unknown as HIDDevice,
    out,
    state: () => state(),
    subscribe(cb) {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    rumble: rec('rumble'),
    setLightbar: rec('lightbar'),
    setLightbarFlash: rec('flash'),
    setPlayerLeds: rec('leds'),
    setMicLed: rec('mic'),
    async setTrigger(side, effect) {
      out[`trigger-${side}`] = [...effect]
      engaged = { ...engaged, [side]: effect[0] !== 0x05 }
    },
    async info() {
      return { firmware: '0x00010215', hardware: '0x00000001', updateVersion: '2.21' }
    },
    async factory() {
      return ds4
        ? {}
        : {
            serial: 'MOCK00012345',
            pcbaId: '0123456789ab',
            btAddress: 'aa:bb:cc:dd:ee:ff',
            batteryMv: 4012,
            touchpadFirmware: '0000000100000002',
          }
    },
    async close() {
      clearInterval(timer)
      listeners.clear()
    },
  }
}

/** Define navigator.hid so the app thinks WebHID exists, then inject the mock through the store. */
export async function installMockHid(family: string, q: URLSearchParams): Promise<MockHid> {
  if (!('hid' in navigator)) {
    Object.defineProperty(navigator, 'hid', {
      value: {
        addEventListener() {},
        removeEventListener() {},
        getDevices: async () => [],
        requestDevice: async () => [],
      },
      configurable: true,
    })
  }
  const mock = createMockHid(family, q.has('edge'))
  useStore.getState().setHid(mock)
  if (q.get('hid') === '2')
    useStore.getState().addHid(createMockHid(family === 'dualsense' ? 'dualshock4' : 'dualsense'))
  useStore.getState().setActiveHid(0)
  const hid = useStore.getState().hid!
  const lb = q.get('lb')
  if (lb)
    await hid.setLightbar([
      parseInt(lb.slice(0, 2), 16),
      parseInt(lb.slice(2, 4), 16),
      parseInt(lb.slice(4, 6), 16),
    ])
  const leds = q.get('leds')
  if (leds) {
    const m = /^P([1-5])$/.exec(leds)
    await hid.setPlayerLeds(
      m ? PLAYER_LED[Number(m[1]) - 1]! : Number(leds.replace('mask:', '')),
      0,
    )
  }
  const mic = q.get('mic')
  if (mic) await hid.setMicLed(mic as MicLedMode)
  const flash = q.get('flash')
  if (flash) await hid.setLightbarFlash(...(flash.split(',').map(Number) as [number, number]))
  const trig = q.get('trig')
  if (trig) {
    const [side, mode] = trig.split(':') as ['left' | 'right', string]
    const fxm = await import('@/core/hid/dualsense/triggerEffects')
    await hid.setTrigger(side, mode === 'weapon' ? fxm.weapon(2, 5, 8) : fxm.feedback(2, 6))
  }
  void POSES
  return mock
}
