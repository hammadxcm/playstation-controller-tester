import { SEED, sonyCrc, writeCrcLE } from './crc32'
import type { HidLogger } from '../log'

/** Sony's factory "test command" protocol: write [deviceId, actionId] to feature 0x80, poll feature 0x81. */
export const DeviceId = { SYSTEM: 1, POWER: 2, ANALOG_DATA: 4, TOUCH: 5, BLUETOOTH: 9 } as const
export const ActionId = {
  READ_BDADR: 2, BATTERY: 3, READ_PCBAID: 4, SOLOMON_UID: 2, SOLOMON_VERSION: 4,
  GET_MCU_UNIQUE_ID: 9, READ_PCBAID_FULL: 17, READ_SERIAL_NUMBER: 19, READ_ASSEMBLE_PARTS_INFO: 21, READ_BATTERY_BARCODE: 24,
} as const
const STATUS = { IDLE: 0, RUNNING: 1, COMPLETE: 2, COMPLETE_2: 3, TIMEOUT: 255 } as const
const PAGE = 56
const TIMEOUT_MS = 1500

export interface CommandTarget {
  device: HIDDevice
  transport: 'usb' | 'bt' | 'unknown'
  log?: HidLogger
}

function featureLength(device: HIDDevice, id: number, fallback: number): number {
  for (const c of device.collections) for (const r of c.featureReports ?? []) if (r.reportId === id) return (r.items ?? []).reduce((s, i) => s + (i.reportCount ?? 0), 0) || fallback
  return fallback
}

/** Send a feature report, padding to the descriptor length and appending the Bluetooth CRC when needed. */
export async function sendFeature(t: CommandTarget, id: number, data: Uint8Array): Promise<void> {
  const len = featureLength(t.device, id, t.transport === 'bt' ? 77 : 63)
  const body = new Uint8Array(len)
  body.set(data.subarray(0, len))
  if (t.transport === 'bt' && len >= 8) writeCrcLE(body, len - 4, sonyCrc(SEED.feature, id, body.subarray(0, len - 4)))
  await t.device.sendFeatureReport(id, body)
  t.log?.({ t: performance.now(), dir: 'feature-out', reportId: id, bytes: body })
}

let chain: Promise<unknown> = Promise.resolve()
/** Serialises commands per page; the controller has a single command slot. */
function locked<T>(fn: () => Promise<T>): Promise<T> {
  const p = chain.then(fn, fn)
  chain = p.catch(() => undefined)
  return p
}

/** Run one command and collect `resultLength` bytes across 56-byte pages. Returns null on failure/timeout. */
export function testCommand(t: CommandTarget, deviceId: number, actionId: number, resultLength: number, sleepMs = 10): Promise<Uint8Array | null> {
  return locked(async () => {
    try {
      await sendFeature(t, 0x80, new Uint8Array([deviceId, actionId]))
    } catch (e) {
      t.log?.({ t: performance.now(), dir: 'error', reportId: 0x80, note: `command ${deviceId}/${actionId}: ${(e as Error).message}` })
      return null
    }
    const out = new Uint8Array(resultLength)
    let page = 0
    const started = performance.now()
    while (performance.now() - started < TIMEOUT_MS) {
      let r: DataView
      try {
        r = await t.device.receiveFeatureReport(0x81)
      } catch (e) {
        t.log?.({ t: performance.now(), dir: 'error', reportId: 0x81, note: (e as Error).message })
        return null
      }
      const off = r.getUint8(0) === 0x81 ? 0 : -1
      const echo = r.getUint8(1 + off) === deviceId && r.getUint8(2 + off) === actionId
      const status = r.getUint8(3 + off)
      if (echo && (status === STATUS.COMPLETE || status === STATUS.COMPLETE_2)) {
        const remaining = resultLength - PAGE * page
        const n = status === STATUS.COMPLETE ? Math.min(remaining, PAGE) : PAGE
        const src = new Uint8Array(r.buffer, r.byteOffset + 4 + off, Math.max(0, Math.min(n, r.byteLength - 4 - off)))
        out.set(src.subarray(0, Math.max(0, remaining)), PAGE * page)
        page++
        if (status === STATUS.COMPLETE) {
          t.log?.({ t: performance.now(), dir: 'feature-in', reportId: 0x81, bytes: out, note: `command ${deviceId}/${actionId}` })
          return out
        }
        continue
      }
      if (echo && status === STATUS.TIMEOUT) break
      await new Promise((res) => setTimeout(res, sleepMs))
    }
    t.log?.({ t: performance.now(), dir: 'error', reportId: 0x81, note: `command ${deviceId}/${actionId} timed out` })
    return null
  })
}
