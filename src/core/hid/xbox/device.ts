import type { HidCaps, HidController, HidState, Transport } from '../controller'
import { noop } from '../controller'
import type { HidLogEntry, HidLogger } from '../log'
import { MICROSOFT, XBOX_BT_PID } from '../../gamepad/identify'
import { fields, reportIds, type Field } from './descriptor'
import { emptyState, hasBattery, mapFields, parseBattery, parseXbox, type XboxMap } from './input'
import { encodeRumble, NO_RUMBLE, RUMBLE_REPORT, type Rumble } from './output'

/** Xbox pads want ≥10 ms between rumble packets; SDL uses 50 ms over Bluetooth. */
export const RUMBLE_GAP_MS = 50
const BATTERY_REPORT = 0x04

/**
 * Xbox One S / Series X|S / Elite Series 2 / Adaptive over Bluetooth. USB is GIP, not HID, so it never gets here.
 * Everything is read from the report descriptor; see `input.ts` for the firmware variants.
 */
export class XboxDevice implements HidController {
  readonly family = 'xbox' as const
  readonly label: string
  readonly caps: HidCaps
  transport: Transport = 'bt'
  private listeners = new Set<(s: HidState) => void>()
  private maps = new Map<number, XboxMap>()
  private batteryIds = new Set<number>()
  private outFields: Field[] | undefined
  private state: HidState
  private want: Rumble = NO_RUMBLE
  private inFlight: Promise<void> | null = null
  private pending = false
  private lastSend = -Infinity
  private onReport = (e: HIDInputReportEvent) => this.handle(e)

  constructor(
    readonly device: HIDDevice,
    private readonly log: HidLogger = () => undefined,
  ) {
    const model = device.vendorId === MICROSOFT ? XBOX_BT_PID[device.productId] : undefined
    this.label = model ?? (device.productName || 'Xbox controller')
    this.state = emptyState(0)
    this.caps = {
      touchpad: false,
      motion: false,
      battery: false,
      rumble: true,
      lightbar: false,
      lightbarFlash: false,
      playerLeds: false,
      micLed: false,
      adaptiveTriggers: false,
      edge: false,
      impulseTriggers: true,
      paddles: false,
    }
  }

  private note(dir: HidLogEntry['dir'], note: string, extra: Partial<HidLogEntry> = {}): void {
    this.log({ t: performance.now(), dir, note, ...extra })
  }

  async open(): Promise<void> {
    if (!this.device.opened) await this.device.open()
    let paddles = false
    for (const id of reportIds(this.device)) {
      const fs = fields(this.device, id)
      if (hasBattery(fs)) this.batteryIds.add(id)
      const m = mapFields(fs)
      if (m.lx || Object.keys(m.buttons).length) {
        this.maps.set(id, m)
        paddles ||= !!m.paddles
      }
    }
    // ponytail: pre-2021 descriptors omit the battery report but the pad still sends it as id 4
    this.batteryIds.add(BATTERY_REPORT)
    this.caps.battery = true
    this.caps.paddles = paddles
    const out = fields(this.device, RUMBLE_REPORT, 'output')
    this.outFields = out.length ? out : undefined
    this.device.addEventListener('inputreport', this.onReport)
    const main = this.maps.get(1)
    this.note(
      'info',
      `open: ${this.device.productName} pid=0x${this.device.productId.toString(16).padStart(4, '0')} layout=${main?.layout ?? 'unknown'} reports=[${[...this.maps.keys()].join(',')}]${paddles ? ' paddles' : ''}`,
    )
  }

  private handle(e: HIDInputReportEvent): void {
    const { reportId, data } = e
    const t = performance.now()
    const m = this.maps.get(reportId)
    if (m) this.state = parseXbox(m, data, this.state, reportId, t)
    else if (this.batteryIds.has(reportId) && data.byteLength >= 1) {
      const b = parseBattery(data.getUint8(0))
      this.state = {
        ...this.state,
        battery: b.battery,
        flags: { ...this.state.flags, usb: b.usb },
        t,
      }
    } else return
    for (const l of this.listeners) l(this.state)
  }

  subscribe(cb: (s: HidState) => void): () => void {
    this.listeners.add(cb)
    return () => this.listeners.delete(cb)
  }

  async rumble(strong: number, weak: number, leftTrigger = 0, rightTrigger = 0): Promise<void> {
    this.want = { strong, weak, left: leftTrigger, right: rightTrigger }
    return this.flush()
  }

  /** Coalesce bursts: one packet in flight, the latest values win, never faster than RUMBLE_GAP_MS. */
  private flush(): Promise<void> {
    if (this.inFlight) {
      this.pending = true
      return this.inFlight
    }
    this.inFlight = (async () => {
      do {
        this.pending = false
        const wait = RUMBLE_GAP_MS - (performance.now() - this.lastSend)
        if (wait > 0) await new Promise((r) => setTimeout(r, wait))
        const bytes = encodeRumble(this.want, this.outFields)
        const t0 = performance.now()
        try {
          await this.device.sendReport(RUMBLE_REPORT, bytes)
          this.note('out', 'rumble', { reportId: RUMBLE_REPORT, bytes, ms: performance.now() - t0 })
        } catch (e) {
          this.note('error', `rumble: ${(e as Error).message}`, { reportId: RUMBLE_REPORT, bytes })
          this.inFlight = null
          throw e
        }
        this.lastSend = performance.now()
      } while (this.pending)
      this.inFlight = null
    })()
    return this.inFlight
  }

  setLightbar(): Promise<void> {
    return noop()
  }
  setLightbarFlash(): Promise<void> {
    return noop()
  }
  setPlayerLeds(): Promise<void> {
    return noop()
  }
  setMicLed(): Promise<void> {
    return noop()
  }
  setTrigger(): Promise<void> {
    return noop()
  }

  async info(): Promise<Record<string, string>> {
    const main = this.maps.get(1)
    return {
      product: this.label,
      productId: `0x${this.device.productId.toString(16).padStart(4, '0')}`,
      transport: 'bluetooth',
      layout: main?.layout ?? 'unknown',
      reports: [...this.maps.keys()].map((k) => `0x${k.toString(16).padStart(2, '0')}`).join(', '),
      rumbleFields: this.outFields ? 'descriptor' : 'fixed',
    }
  }

  async close(): Promise<void> {
    this.device.removeEventListener('inputreport', this.onReport)
    this.listeners.clear()
    if (this.device.opened) {
      await this.rumble(0, 0).catch(() => undefined)
      await this.device.close()
    }
  }
}
