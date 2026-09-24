import type { HidState, Transport } from '../controller'
import type { HidLogEntry, HidLogger } from '../log'
import { SEED, sonyCrc, writeCrcLE } from './crc32'

const BT_KEEPALIVE_MS = 500
const BT_FIRST_REPORT_TIMEOUT_MS = 2500
const GAMEPAD = { usagePage: 0x01, usage: 0x05 }

export interface SonyIds {
  inputUsb: number
  inputBt: number
  outputUsb: number
  outputBt: number
  /** calibration feature reports to try on open; reading one also promotes BT to full reports */
  calibration: number[]
}

/** Largest input report (in bits) of the gamepad collection; Sony pads report 504 over USB and 616 over BT. */
export function inputReportBits(device: HIDDevice): number {
  let max = 0
  for (const c of device.collections) {
    if (c.usagePage !== GAMEPAD.usagePage || c.usage !== GAMEPAD.usage) continue
    for (const r of c.inputReports ?? []) {
      const bits = (r.items ?? []).reduce(
        (s, i) => s + (i.reportSize ?? 0) * (i.reportCount ?? 0),
        0,
      )
      if (bits > max) max = bits
    }
  }
  return max
}

export function detectByBits(device: HIDDevice): Transport {
  const bits = inputReportBits(device)
  if (bits === 504) return 'usb'
  if (bits === 616) return 'bt'
  return 'unknown'
}

export function detectByIds(device: HIDDevice, ids: SonyIds): Transport {
  const out = new Set<number>()
  for (const c of device.collections)
    for (const r of c.outputReports ?? []) if (r.reportId !== undefined) out.add(r.reportId)
  if (out.has(ids.outputUsb) && !out.has(ids.outputBt)) return 'usb'
  if (out.has(ids.outputBt) && !out.has(ids.outputUsb)) return 'bt'
  return 'unknown'
}

/**
 * Shared USB/Bluetooth plumbing for Sony pads: transport detection, enhanced-mode promotion,
 * one-in-flight output queue (latest state wins), CRC framing, logging, fan-out.
 */
export abstract class SonyDevice {
  transport: Transport = 'unknown'
  private listeners = new Set<(s: HidState) => void>()
  private keepalive: ReturnType<typeof setInterval> | null = null
  private promoted = false
  private inFlight = false
  private pending = false
  private waiters: Array<(err?: Error) => void> = []
  private initialised = false
  private openDone = false
  private confirm: (() => void) | null = null
  private onReport = (e: HIDInputReportEvent) => this.handle(e)

  protected abstract readonly ids: SonyIds
  protected abstract readonly btPayloadOffset: number
  protected abstract parse(d: DataView, reportId: number, t: number): HidState | null
  protected abstract onCalibration(id: number, d: DataView): void
  /** Called once the device is open and the transport is known; read firmware etc. */
  protected async onOpened(): Promise<void> {}
  /** Current output state as the family's common payload. */
  protected abstract encode(): Uint8Array
  /** First packet after connect (reset lights, enable rumble/trigger paths). null = none. */
  protected abstract initPayload(): Uint8Array | null
  /** Packet sent before closing (release LEDs, stop motors). null = none. */
  protected abstract offPayload(): Uint8Array | null
  protected abstract frameBt(payload: Uint8Array): Uint8Array<ArrayBuffer>
  protected abstract frameUsb(payload: Uint8Array): Uint8Array<ArrayBuffer>

  constructor(
    readonly device: HIDDevice,
    protected readonly log: HidLogger = () => undefined,
  ) {}

  protected note(dir: HidLogEntry['dir'], note: string, extra: Partial<HidLogEntry> = {}): void {
    this.log({ t: performance.now(), dir, note, ...extra })
  }

  async open(): Promise<void> {
    if (!this.device.opened) await this.device.open()
    this.transport = detectByBits(this.device)
    if (this.transport === 'unknown') this.transport = detectByIds(this.device, this.ids)
    this.note(
      'info',
      `open: ${this.device.productName} transport=${this.transport} inputBits=${inputReportBits(this.device)}`,
    )
    this.device.addEventListener('inputreport', this.onReport)
    await this.readCalibration()
    // USB is safe to talk to immediately; BT (or an inconclusive descriptor) must see a full report first.
    if (this.transport !== 'usb') await this.waitForFullReport()
    await this.onOpened()
    this.openDone = true
    await this.initialise()
  }

  private waitForFullReport(): Promise<void> {
    return new Promise<void>((resolve) => {
      const t = setTimeout(() => {
        this.note(
          'error',
          `no full input report within ${BT_FIRST_REPORT_TIMEOUT_MS} ms; still in reduced Bluetooth mode? Try re-pairing or USB.`,
        )
        this.confirm = null
        resolve()
      }, BT_FIRST_REPORT_TIMEOUT_MS)
      this.confirm = () => {
        clearTimeout(t)
        this.confirm = null
        resolve()
      }
    })
  }

  private async initialise(): Promise<void> {
    if (this.initialised || this.transport === 'unknown') return
    this.initialised = true
    const p = this.initPayload()
    if (p) await this.sendPayload(p, 'init')
    if (this.pending) void this.runQueue()
  }

  private async readCalibration(): Promise<void> {
    for (const id of this.ids.calibration) {
      try {
        const d = await this.device.receiveFeatureReport(id)
        this.log({
          t: performance.now(),
          dir: 'feature-in',
          reportId: id,
          bytes: new Uint8Array(d.buffer, d.byteOffset, d.byteLength),
        })
        this.onCalibration(id, d)
        this.promoted = true
        return
      } catch (e) {
        this.note('error', `feature 0x${id.toString(16)} failed: ${(e as Error).message}`)
      }
    }
  }

  protected async feature(id: number): Promise<DataView> {
    const d = await this.device.receiveFeatureReport(id)
    this.log({
      t: performance.now(),
      dir: 'feature-in',
      reportId: id,
      bytes: new Uint8Array(d.buffer, d.byteOffset, d.byteLength),
    })
    return d
  }

  private handle(e: HIDInputReportEvent): void {
    const { reportId, data } = e
    if (reportId === this.ids.inputBt && data.byteLength >= 60) {
      if (this.transport !== 'bt') {
        this.transport = 'bt'
        this.note('info', 'transport confirmed: bt (full report seen)')
      }
      this.confirmed()
    } else if (reportId === this.ids.inputUsb) {
      if (data.byteLength >= 60) {
        if (this.transport !== 'usb') {
          this.transport = 'usb'
          this.note('info', 'transport confirmed: usb (full 0x01 seen)')
        }
        this.confirmed()
      } else if (!this.promoted) void this.readCalibration()
    }
    const s = this.parse(data, reportId, performance.now())
    if (s) this.listeners.forEach((l) => l(s))
  }

  private confirmed(): void {
    this.confirm?.()
    if (this.openDone && !this.initialised) void this.initialise()
  }

  subscribe(cb: (s: HidState) => void): () => void {
    this.listeners.add(cb)
    return () => this.listeners.delete(cb)
  }

  private async sendPayload(payload: Uint8Array, what: string): Promise<void> {
    const t0 = performance.now()
    let id: number
    let body: Uint8Array<ArrayBuffer>
    if (this.transport === 'bt') {
      id = this.ids.outputBt
      body = this.frameBt(payload)
      writeCrcLE(body, 73, sonyCrc(SEED.output, id, body.subarray(0, 73)))
    } else {
      id = this.ids.outputUsb
      body = this.frameUsb(payload)
    }
    try {
      await this.device.sendReport(id, body)
      this.log({
        t: t0,
        dir: 'out',
        reportId: id,
        bytes: body,
        note: what,
        ms: performance.now() - t0,
      })
    } catch (e) {
      this.log({
        t: t0,
        dir: 'error',
        reportId: id,
        bytes: body,
        note: `${what}: ${(e as Error).message}`,
      })
      throw e
    }
  }

  /** Queue a send of the current output state. Resolves when a packet carrying this state has gone out. */
  protected flush(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.waiters.push((err) => (err ? reject(err) : resolve()))
      this.pending = true
      if (this.transport === 'unknown' || !this.initialised) {
        this.note('info', 'output queued until transport is confirmed')
        return
      }
      void this.runQueue()
    })
  }

  private async runQueue(): Promise<void> {
    if (this.inFlight) return
    this.inFlight = true
    try {
      while (this.pending) {
        this.pending = false
        const waiters = this.waiters
        this.waiters = []
        try {
          await this.sendPayload(this.encode(), 'state')
          waiters.forEach((w) => w())
        } catch (e) {
          waiters.forEach((w) => w(e as Error))
        }
      }
    } finally {
      this.inFlight = false
    }
    if (this.transport === 'bt' && !this.keepalive)
      this.keepalive = setInterval(() => void this.keepaliveTick(), BT_KEEPALIVE_MS)
  }

  private async keepaliveTick(): Promise<void> {
    if (this.inFlight) return
    try {
      await this.sendPayload(this.encode(), 'keepalive')
    } catch {
      // already logged by sendPayload; the next tick retries
    }
  }

  async close(): Promise<void> {
    if (this.keepalive) clearInterval(this.keepalive)
    this.keepalive = null
    this.device.removeEventListener('inputreport', this.onReport)
    this.listeners.clear()
    const off = this.transport !== 'unknown' ? this.offPayload() : null
    if (off && this.device.opened) await this.sendPayload(off, 'off').catch(() => undefined)
    if (this.device.opened)
      await this.device.close().catch((e: Error) => this.note('error', `close: ${e.message}`))
    this.note('info', 'closed')
  }
}
