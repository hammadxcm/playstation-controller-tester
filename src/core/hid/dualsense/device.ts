import type { AudioSettings, HidCaps, HidController, HidState, MicLedMode } from '../controller'
import type { HidLogger } from '../log'
import { parseCalibration, type Calibration } from '../sony/calibration'
import { SonyDevice, type SonyIds } from '../sony/device'
import { FLAG0, FLAG1, FLAG2, REPORT, SIZE } from './constants'
import { parseDualSense } from './input'
import { emptyOutput, encodeOutput, type DualSenseOutput } from './output'
import * as fx from './triggerEffects'
import { PID } from '../../gamepad/identify'
import { readFactoryInfo } from '../sony/factory'

const CAPS: HidCaps = {
  touchpad: true, motion: true, battery: true, rumble: true, lightbar: true,
  lightbarFlash: false, playerLeds: true, micLed: true, adaptiveTriggers: true, edge: false,
}

export class DualSenseDevice extends SonyDevice implements HidController {
  readonly family = 'dualsense' as const
  readonly caps: HidCaps
  readonly label: string
  protected readonly ids: SonyIds = {
    inputUsb: REPORT.inputUsb, inputBt: REPORT.inputBt,
    outputUsb: REPORT.outputUsb, outputBt: REPORT.outputBt,
    calibration: [REPORT.featCalibration],
  }
  protected readonly btPayloadOffset = 1
  private cal: Calibration | null = null
  private out: DualSenseOutput = emptyOutput()
  private cachedInfo: Record<string, string> | null = null
  private seq = 0

  constructor(device: HIDDevice, log?: HidLogger) {
    super(device, log)
    const edge = device.productId === PID.dualsenseEdge
    this.label = edge ? 'DualSense Edge' : 'DualSense'
    this.caps = { ...CAPS, edge }
  }

  protected parse(d: DataView, reportId: number, t: number): HidState | null {
    if (reportId === REPORT.inputBt) {
      if (d.byteLength < 1 + SIZE.state) return null
      return parseDualSense(d, this.btPayloadOffset, this.cal, t, reportId)
    }
    if (reportId === REPORT.inputUsb && d.byteLength >= SIZE.state) return parseDualSense(d, 0, this.cal, t, reportId)
    return null // BT reduced mode: 9-byte report, ignored until promoted
  }

  protected onCalibration(id: number, d: DataView): void {
    const off = d.byteLength >= 41 && d.getUint8(0) === id ? 1 : 0
    if (d.byteLength - off >= 34) this.cal = parseCalibration(d, off)
  }

  protected async onOpened(): Promise<void> {
    await this.readInfo()
  }

  private async readInfo(): Promise<Record<string, string>> {
    const info: Record<string, string> = { product: this.label, transport: this.transport }
    try {
      const d = await this.feature(REPORT.featFirmware)
      const off = d.getUint8(0) === REPORT.featFirmware ? 0 : -1
      const hw = d.getUint32(24 + off, true)
      const fw = d.getUint32(28 + off, true)
      const upd = d.getUint16(44 + off, true)
      info.hardware = `0x${hw.toString(16).padStart(8, '0')}`
      info.firmware = `0x${fw.toString(16).padStart(8, '0')}`
      info.updateVersion = `${upd >> 8}.${upd & 0xff}`
      this.out.vibrationV2 = upd >= 0x0215
      this.note('info', `firmware ${info.firmware} update ${info.updateVersion} vibrationV2=${this.out.vibrationV2}`)
    } catch (e) {
      info.firmware = 'unavailable'
      this.note('error', `feature 0x20 failed: ${(e as Error).message}`)
    }
    this.cachedInfo = info
    return info
  }

  protected encode(): Uint8Array {
    return encodeOutput(this.out)
  }
  /** Reset packet like the reference implementation: enable every path, all lights off, fade the boot glow. */
  protected initPayload(): Uint8Array {
    const p = new Uint8Array(SIZE.outputPayload)
    p[0] = FLAG0.compatVibration | FLAG0.haptics | FLAG0.rightTrigger | FLAG0.leftTrigger | 0xf0
    p[1] = FLAG1.micLed | FLAG1.powerSave | FLAG1.lightbar | FLAG1.playerLeds | 0xe0
    p[10] = fx.off()[0]!
    p[21] = fx.off()[0]!
    p[38] = FLAG2.lightbarSetup
    p[41] = 0x02
    return p
  }
  protected offPayload(): Uint8Array {
    return encodeOutput({ ...emptyOutput(), rumble: { strong: 0, weak: 0 }, trigger: { left: fx.off(), right: fx.off() }, releaseLeds: true, vibrationV2: this.out.vibrationV2 })
  }
  protected frameUsb(payload: Uint8Array): Uint8Array<ArrayBuffer> {
    const b = new Uint8Array(SIZE.outputUsb)
    b.set(payload, 0)
    return b
  }
  protected frameBt(payload: Uint8Array): Uint8Array<ArrayBuffer> {
    const b = new Uint8Array(SIZE.outputBt)
    b[0] = (this.seq++ & 0x0f) << 4
    b[1] = 0x10
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
  async setAudio(a: AudioSettings): Promise<void> {
    this.out.audio = a
    await this.flush()
  }
  async info(): Promise<Record<string, string>> {
    return this.cachedInfo ?? this.readInfo()
  }
  async factory(): Promise<Record<string, string | number | undefined>> {
    return readFactoryInfo({ device: this.device, transport: this.transport, log: this.log }) as Promise<Record<string, string | number | undefined>>
  }
}
