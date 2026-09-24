import type { HidCaps, HidController, HidState } from '../controller'
import { parseCalibration, type Calibration } from '../sony/calibration'
import { SonyDevice } from '../sony/device'
import { REPORT, SIZE } from './constants'
import { parseDualShock4 } from './input'
import { encodeOutput, type DualShock4Output } from './output'
import { PID } from '../../gamepad/identify'

const CAPS: HidCaps = {
  touchpad: true, motion: true, battery: true, rumble: true, lightbar: true,
  lightbarFlash: true, playerLeds: false, micLed: false, adaptiveTriggers: false,
}

export class DualShock4Device extends SonyDevice implements HidController {
  readonly family = 'dualshock4' as const
  readonly caps = CAPS
  readonly label: string
  protected readonly ids = {
    inputUsb: REPORT.inputUsb, inputBt: REPORT.inputBt,
    outputUsb: REPORT.outputUsb, outputBt: REPORT.outputBt,
    calibration: [REPORT.featCalibrationBt, REPORT.featCalibrationUsb],
  }
  protected readonly btPayloadOffset = 2
  private cal: Calibration | null = null
  private out: DualShock4Output = { rumble: null, lightbar: null, flash: null }

  constructor(device: HIDDevice) {
    super(device)
    this.label = device.productId === PID.ds4v1 ? 'DualShock 4 (v1)' : device.productId === PID.ds4dongle ? 'DualShock 4 (USB adapter)' : 'DualShock 4'
  }

  protected parse(d: DataView, reportId: number, t: number): HidState | null {
    if (reportId >= 0x11 && reportId <= 0x19) {
      if (d.byteLength < 2 + SIZE.state || !(d.getUint8(0) & 0x80)) return null
      return parseDualShock4(d, this.btPayloadOffset, this.cal, t, reportId)
    }
    if (reportId === REPORT.inputUsb && d.byteLength >= SIZE.state) return parseDualShock4(d, 0, this.cal, t, reportId)
    return null
  }

  protected onCalibration(id: number, d: DataView): void {
    const off = d.getUint8(0) === id ? 1 : 0
    if (d.byteLength - off >= 34) this.cal = parseCalibration(d, off, id === REPORT.featCalibrationBt)
  }

  protected encode(): Uint8Array {
    return encodeOutput(this.out)
  }
  protected frameUsb(payload: Uint8Array): Uint8Array<ArrayBuffer> {
    const b = new Uint8Array(SIZE.outputUsb)
    b.set(payload, 0)
    return b
  }
  protected frameBt(payload: Uint8Array): Uint8Array<ArrayBuffer> {
    const b = new Uint8Array(SIZE.outputBt)
    b[0] = 0xc0 // HID data + CRC present; SonyDevice overwrites the high nibble with the sequence
    b.set(payload, 2)
    return b
  }

  async rumble(strong: number, weak: number): Promise<void> {
    this.out.rumble = { strong, weak }
    await this.flush()
  }
  async setLightbar(rgb: [number, number, number] | null): Promise<void> {
    this.out.lightbar = rgb ?? [0, 0, 0]
    await this.flush()
  }
  async setLightbarFlash(onMs: number, offMs: number): Promise<void> {
    this.out.flash = onMs || offMs ? { onMs, offMs } : null
    if (!this.out.flash) this.out.lightbar ??= [0, 0, 64]
    await this.flush()
  }
  async setPlayerLeds(): Promise<void> {}
  async setMicLed(): Promise<void> {}
  async setTrigger(): Promise<void> {}
  async info(): Promise<Record<string, string>> {
    return { product: this.label, transport: this.transport }
  }
}
