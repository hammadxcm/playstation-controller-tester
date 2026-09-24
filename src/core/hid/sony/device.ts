import type { HidState, Transport } from '../controller'
import { SEED, sonyCrc, writeCrcLE } from './crc32'

const BT_KEEPALIVE_MS = 500

/**
 * Shared USB/Bluetooth plumbing for Sony pads. Subclasses supply report ids,
 * the parser and the current output payload; this class handles transport
 * detection, CRC framing, enhanced-mode promotion and fan-out.
 */
export abstract class SonyDevice {
  readonly transport: Transport
  private listeners = new Set<(s: HidState) => void>()
  private seq = 0
  private keepalive = 0
  private promoted = false
  private onReport = (e: HIDInputReportEvent) => this.handle(e)

  protected abstract readonly ids: {
    inputUsb: number
    inputBt: number
    outputUsb: number
    outputBt: number
    /** calibration feature report to read on open; reading it also promotes BT to full reports */
    calibration: number[]
  }
  protected abstract readonly btPayloadOffset: number
  protected abstract parse(d: DataView, reportId: number, t: number): HidState | null
  protected abstract onCalibration(id: number, d: DataView): void
  protected abstract encode(): Uint8Array
  /** Build the BT body (77 bytes, no CRC yet) around the encoded payload. */
  protected abstract frameBt(payload: Uint8Array): Uint8Array<ArrayBuffer>
  /** Build the USB body around the encoded payload. */
  protected abstract frameUsb(payload: Uint8Array): Uint8Array<ArrayBuffer>

  constructor(readonly device: HIDDevice) {
    this.transport = 'unknown'
    // Descriptor-based detection is deterministic before any input arrives.
    const outputs = new Set<number>()
    for (const c of device.collections) for (const r of c.outputReports ?? []) if (r.reportId !== undefined) outputs.add(r.reportId)
    // ids are abstract; resolved lazily in open()
    this.detect = () => {
      if (outputs.has(this.ids.outputBt) && !outputs.has(this.ids.outputUsb)) return 'bt'
      if (outputs.has(this.ids.outputUsb)) return 'usb'
      return 'unknown'
    }
  }
  private detect: () => Transport
  private setTransport(t: Transport) {
    ;(this as { transport: Transport }).transport = t
  }

  async open(): Promise<void> {
    if (!this.device.opened) await this.device.open()
    this.setTransport(this.detect())
    this.device.addEventListener('inputreport', this.onReport)
    await this.readCalibration()
  }

  private async readCalibration(): Promise<void> {
    for (const id of this.ids.calibration) {
      try {
        const d = await this.device.receiveFeatureReport(id)
        this.onCalibration(id, d)
        this.promoted = true
        return
      } catch {
        /* try next id */
      }
    }
  }

  private handle(e: HIDInputReportEvent): void {
    const { reportId, data } = e
    if (this.transport === 'unknown') {
      if (reportId === this.ids.inputBt) this.setTransport('bt')
      else if (reportId === this.ids.inputUsb && data.byteLength >= 60) this.setTransport('usb')
      else if (reportId === this.ids.inputUsb && !this.promoted) void this.readCalibration()
    }
    const s = this.parse(data, reportId, performance.now())
    if (s) this.listeners.forEach((l) => l(s))
  }

  subscribe(cb: (s: HidState) => void): () => void {
    this.listeners.add(cb)
    return () => this.listeners.delete(cb)
  }

  /** Encode current output state and send it over the detected transport. */
  protected async flush(): Promise<void> {
    const payload = this.encode()
    if (this.transport === 'bt') {
      const body = this.frameBt(payload)
      body[0] = (body[0]! & 0x0f) | ((this.seq++ & 0x0f) << 4)
      writeCrcLE(body, 73, sonyCrc(SEED.output, this.ids.outputBt, body.subarray(0, 73)))
      await this.device.sendReport(this.ids.outputBt, body)
      if (!this.keepalive) this.keepalive = window.setInterval(() => void this.flush().catch(() => undefined), BT_KEEPALIVE_MS)
    } else if (this.transport === 'usb') {
      await this.device.sendReport(this.ids.outputUsb, this.frameUsb(payload))
    }
    // ponytail: unknown transport = BT simple mode; sending anything would be a guess, so drop it.
  }

  async close(): Promise<void> {
    if (this.keepalive) clearInterval(this.keepalive)
    this.keepalive = 0
    this.device.removeEventListener('inputreport', this.onReport)
    this.listeners.clear()
    if (this.device.opened) await this.device.close().catch(() => undefined)
  }
}
