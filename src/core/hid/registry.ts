import { PID, SONY } from '../gamepad/identify'
import type { HidController } from './controller'
import { DualSenseDevice } from './dualsense/device'
import { DualShock4Device } from './dualshock4/device'
import type { HidLogger } from './log'

const DRIVERS: {
  pids: number[]
  create: (d: HIDDevice, log?: HidLogger) => HidController & { open(): Promise<void> }
}[] = [
  { pids: [PID.dualsense, PID.dualsenseEdge], create: (d, log) => new DualSenseDevice(d, log) },
  { pids: [PID.ds4v1, PID.ds4v2, PID.ds4dongle], create: (d, log) => new DualShock4Device(d, log) },
]

export const FILTERS: HIDDeviceFilter[] = DRIVERS.flatMap((dr) =>
  dr.pids.map((productId) => ({ vendorId: SONY, productId })),
)

export const webHidSupported = (): boolean => typeof navigator !== 'undefined' && 'hid' in navigator

function driverFor(dev: HIDDevice) {
  if (dev.vendorId !== SONY) return null
  return DRIVERS.find((dr) => dr.pids.includes(dev.productId)) ?? null
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

/** Prompt the user to pick a supported Sony pad. Must be called from a user gesture. */
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
