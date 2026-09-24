import { MICROSOFT, PID, SONY, XBOX_BT_PID } from '../gamepad/identify'
import type { HidController } from './controller'
import { DualSenseDevice } from './dualsense/device'
import { DualShock4Device } from './dualshock4/device'
import { XboxDevice } from './xbox/device'
import type { HidLogger } from './log'

const DRIVERS: {
  vendorId: number
  pids: number[]
  create: (d: HIDDevice, log?: HidLogger) => HidController & { open(): Promise<void> }
}[] = [
  {
    vendorId: SONY,
    pids: [PID.dualsense, PID.dualsenseEdge],
    create: (d, log) => new DualSenseDevice(d, log),
  },
  {
    vendorId: SONY,
    pids: [PID.ds4v1, PID.ds4v2, PID.ds4dongle],
    create: (d, log) => new DualShock4Device(d, log),
  },
  {
    vendorId: MICROSOFT,
    pids: Object.keys(XBOX_BT_PID).map(Number),
    create: (d, log) => new XboxDevice(d, log),
  },
]

export const FILTERS: HIDDeviceFilter[] = DRIVERS.flatMap((dr) =>
  dr.pids.map((productId) => ({ vendorId: dr.vendorId, productId })),
)

export const webHidSupported = (): boolean => typeof navigator !== 'undefined' && 'hid' in navigator

function driverFor(dev: HIDDevice) {
  return (
    DRIVERS.find((dr) => dr.vendorId === dev.vendorId && dr.pids.includes(dev.productId)) ?? null
  )
}

export async function openController(
  dev: HIDDevice,
  log?: HidLogger,
): Promise<HidController | null> {
  const dr = driverFor(dev)
  if (!dr) return null
  const c = dr.create(dev, log)
  await c.open()
  return c
}

/** Prompt the user to pick a supported pad (Sony over USB/BT, Xbox over BT). Must be called from a user gesture. */
export async function requestController(log?: HidLogger): Promise<HidController | null> {
  const [dev] = await navigator.hid.requestDevice({ filters: FILTERS })
  return dev ? openController(dev, log) : null
}

/** Re-open every pad the user already granted access to. */
export async function reopenGranted(log?: HidLogger): Promise<HidController[]> {
  const devs = await navigator.hid.getDevices()
  const out: HidController[] = []
  for (const dev of devs) {
    const c = await openController(dev, log).catch((e: Error) => {
      log?.({ t: performance.now(), dir: 'error', note: `reopen ${dev.productName}: ${e.message}` })
      return null
    })
    if (c) out.push(c)
  }
  return out
}
