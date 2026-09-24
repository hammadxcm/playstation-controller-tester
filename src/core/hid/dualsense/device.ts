import type { HidCaps, HidController, HidState, MicLedMode } from '../controller'
import { parseCalibration, type Calibration } from '../sony/calibration'
import { SonyDevice } from '../sony/device'
import { REPORT, SIZE } from './constants'
import { parseDualSense } from './input'
import { emptyOutput, encodeOutput, type DualSenseOutput } from './output'
import * as fx from './triggerEffects'
import { PID } from '../../gamepad/identify'

const CAPS: HidCaps = {
  touchpad: true, motion: true, battery: true, rumble: true, lightbar: true,
  lightbarFlash: false, playerLeds: true, micLed: true, adaptiveTriggers: true,
}

export class DualSenseDevice extends SonyDevice implements HidController {
  readonly family = 'dualsense' as const
  readonly caps = CAPS
  readonly label: string
  protected readonly ids = {
    inputUsb: REPORT.inputUsb, inputBt: REPORT.inputBt,
    outputUsb: REPORT.outputUsb, outputBt: REPORT.outputBt,
    calibration: [REPORT.featCalibration],
  }
  protected readonly btPayloadOffset = 1
  private cal: Calibration | null = null
  private out: DualSenseOutput = emptyOutput()
  private setupSent = false

  constructor(device: HIDDevice) {
    super(device)
    this.label = device.productId === PID.dualsenseEdge ? 'DualSense Edge' : 'DualSense'
  }

  protected parse(d: DataView, reportId: number, t: number): HidState | null {
    if (reportId === REPORT.inputBt) {
      if (d.byteLength < 1 + SIZE.state) return null
      return parseDualSense(d, this.btPayloadOffset, this.cal, t, reportId)
    }
    if (reportId === REPORT.inputUsb && d.byteLength >= SIZE.state) return parseDualSense(d, 0, this.cal, t, reportId)
    return null // BT simple mode: 9-byte report, ignored until promoted
  }

  protected onCalibration(id: number, d: DataView): void {
    const off = d.byteLength >= 41 && d.getUint8(0) === id ? 1 : 0
    if (d.byteLength - off >= 34) this.cal = parseCalibration(d, off)
  }

  protected encode(): Uint8Array {
    const o = { ...this.out, lightbarSetup: !this.setupSent }
    this.setupSent = true
    return encodeOutput(o)
  }
  protected frameUsb(payload: Uint8Array): Uint8Array<ArrayBuffer> {
    const b = new Uint8Array(SIZE.outputUsb)
    b.set(payload, 0)
    return b
  }
  protected frameBt(payload: Uint8Array): Uint8Array<ArrayBuffer> {
    const b = new Uint8Array(SIZE.outputBt)
    b[1] = 0x10
    b.set(payload, 2)
    return b
  }

  async rumble(strong: number, weak: number): Promise<void> {
    this.out.rumble = strong || weak ? { strong, weak } : { strong: 0, weak: 0 }
    await this.flush()
  }
  async setLightbar(rgb: [number, number, number] | null): Promise<void> {
    this.out.lightbar = rgb ?? [0, 0, 0]
    await this.flush()
  }
  async setLightbarFlash(): Promise<void> {
    /* not supported on DualSense */
  }
  async setPlayerLeds(mask: number, brightness: 0 | 1 | 2): Promise<void> {
    this.out.playerLeds = { mask, brightness }
    await this.flush()
  }
  async setMicLed(mode: MicLedMode): Promise<void> {
    this.out.micLed = mode === 'off' ? 0 : mode === 'on' ? 1 : 2
    await this.flush()
  }
  async setTrigger(side: 'left' | 'right', effect: Uint8Array): Promise<void> {
    this.out.trigger[side] = effect
    await this.flush()
  }
  async resetTriggers(): Promise<void> {
    this.out.trigger = { left: fx.off(), right: fx.off() }
    await this.flush()
  }

  async info(): Promise<Record<string, string>> {
    const info: Record<string, string> = { product: this.label, transport: this.transport }
    try {
      const d = await this.device.receiveFeatureReport(REPORT.featFirmware)
      const off = d.getUint8(0) === REPORT.featFirmware ? 0 : -1
      const hw = d.getUint32(24 + off, true)
      const fw = d.getUint32(28 + off, true)
      const upd = d.getUint16(44 + off, true)
      info.hardware = `0x${hw.toString(16).padStart(8, '0')}`
      info.firmware = `0x${fw.toString(16).padStart(8, '0')}`
      info.updateVersion = `${upd >> 8}.${upd & 0xff}`
      this.out.vibrationV2 = upd >= 0x0215
    } catch {
      info.firmware = 'unavailable'
    }
    return info
  }
}
