import { PID, SONY } from '../gamepad/identify'
import type { HidController } from './controller'
import { DualSenseDevice } from './dualsense/device'
import { DualShock4Device } from './dualshock4/device'

const DRIVERS: { pids: number[]; create: (d: HIDDevice) => HidController & { open(): Promise<void> } }[] = [
  { pids: [PID.dualsense, PID.dualsenseEdge], create: (d) => new DualSenseDevice(d) },
  { pids: [PID.ds4v1, PID.ds4v2, PID.ds4dongle], create: (d) => new DualShock4Device(d) },
]

export const FILTERS: HIDDeviceFilter[] = DRIVERS.flatMap((dr) => dr.pids.map((productId) => ({ vendorId: SONY, productId })))

export const webHidSupported = (): boolean => typeof navigator !== 'undefined' && 'hid' in navigator

function driverFor(dev: HIDDevice) {
  if (dev.vendorId !== SONY) return null
  return DRIVERS.find((dr) => dr.pids.includes(dev.productId)) ?? null
}

async function openController(dev: HIDDevice): Promise<HidController | null> {
  const dr = driverFor(dev)
  if (!dr) return null
  const c = dr.create(dev)
  await c.open()
  return c
}

/** Prompt the user to pick a supported Sony pad. Must be called from a user gesture. */
export async function requestController(): Promise<HidController | null> {
  const [dev] = await navigator.hid.requestDevice({ filters: FILTERS })
  return dev ? openController(dev) : null
}

/** Re-open a pad the user already granted access to, if any. */
export async function reopenGranted(): Promise<HidController | null> {
  const devs = await navigator.hid.getDevices()
  for (const dev of devs) {
    const c = await openController(dev).catch(() => null)
    if (c) return c
  }
  return null
}
