/** Minimal HIDDevice stand-in for unit tests: records sends, serves canned feature reports, injects input reports. */
export class FakeHidDevice extends EventTarget {
  opened = false
  sent: { id: number; data: Uint8Array }[] = []
  featureSent: { id: number; data: Uint8Array }[] = []
  features = new Map<number, Uint8Array>()
  sendDelayMs = 0
  failSend: Error | null = null
  collections: HIDCollectionInfo[]

  constructor(
    public vendorId: number,
    public productId: number,
    public productName: string,
    opts: { inputBits?: number; outputIds?: number[] } = {},
  ) {
    super()
    const bits = opts.inputBits ?? 504
    this.collections = [
      {
        usagePage: 0x01,
        usage: 0x05,
        type: 0,
        children: [],
        inputReports: [{ reportId: 1, items: [{ reportSize: 8, reportCount: bits / 8 }] } as unknown as HIDReportInfo],
        outputReports: (opts.outputIds ?? [0x02]).map((reportId) => ({ reportId, items: [] }) as unknown as HIDReportInfo),
        featureReports: [],
      } as unknown as HIDCollectionInfo,
    ]
  }
  async open() {
    this.opened = true
  }
  async close() {
    this.opened = false
  }
  async forget() {}
  async sendReport(id: number, data: BufferSource) {
    if (this.failSend) throw this.failSend
    if (this.sendDelayMs) await new Promise((r) => setTimeout(r, this.sendDelayMs))
    this.sent.push({ id, data: new Uint8Array(data as ArrayBuffer instanceof ArrayBuffer ? (data as ArrayBuffer) : (data as Uint8Array).buffer as ArrayBuffer, (data as Uint8Array).byteOffset ?? 0, data.byteLength) })
  }
  async sendFeatureReport(id: number, data: BufferSource) {
    this.featureSent.push({ id, data: new Uint8Array((data as Uint8Array).buffer as ArrayBuffer, (data as Uint8Array).byteOffset ?? 0, data.byteLength) })
  }
  async receiveFeatureReport(id: number): Promise<DataView> {
    const b = this.features.get(id)
    if (!b) throw new Error(`feature 0x${id.toString(16)} not available`)
    return new DataView(b.buffer as ArrayBuffer, b.byteOffset, b.byteLength)
  }
  /** Simulate an incoming input report (bytes exclude the report id, like WebHID). */
  input(reportId: number, bytes: Uint8Array) {
    const e = Object.assign(new Event('inputreport'), { reportId, data: new DataView(bytes.buffer as ArrayBuffer, bytes.byteOffset, bytes.byteLength), device: this })
    this.dispatchEvent(e)
  }
  asHid(): HIDDevice {
    return this as unknown as HIDDevice
  }
}
