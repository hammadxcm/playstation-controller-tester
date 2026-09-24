/**
 * Generic HID report-descriptor walker over WebHID's parsed `HIDCollectionInfo`.
 * Xbox pads ship several descriptor variants per firmware, so nothing here knows about Xbox:
 * callers look fields up by usage instead of hardcoding byte offsets.
 */

/** `usagePage << 16 | usage`, the same packing WebHID uses in `HIDReportItem.usages` */
export const usage = (page: number, id: number): number => ((page << 16) | id) >>> 0

export interface Field {
  usage: number
  /** bit offset inside the report payload (report id excluded) */
  bit: number
  size: number
  min: number
  max: number
}

type Report = { reportId?: number; items?: HIDReportItem[] }

function walk(
  cols: HIDCollectionInfo[] | undefined,
  pick: (c: HIDCollectionInfo) => Report[] | undefined,
  out: Report[],
) {
  for (const c of cols ?? []) {
    out.push(...(pick(c) ?? []))
    walk(c.children, pick, out)
  }
}

/** Input report ids declared anywhere in the descriptor. */
export function reportIds(device: HIDDevice): number[] {
  const reports: Report[] = []
  walk(device.collections, (c) => c.inputReports, reports)
  return [...new Set(reports.map((r) => r.reportId).filter((id): id is number => id !== undefined))]
}

/** Every variable field of one report id, in bit order. Padding and array items only advance the offset. */
export function fields(
  device: HIDDevice,
  reportId: number,
  kind: 'input' | 'output' = 'input',
): Field[] {
  const reports: Report[] = []
  walk(device.collections, (c) => (kind === 'input' ? c.inputReports : c.outputReports), reports)
  const out: Field[] = []
  let bit = 0
  for (const r of reports) {
    if ((r.reportId ?? 0) !== reportId) continue
    for (const it of r.items ?? []) {
      const size = it.reportSize ?? 0
      const count = it.reportCount ?? 0
      if (!it.isConstant && !it.isArray) {
        const list = it.isRange
          ? Array.from({ length: count }, (_, i) => (it.usageMinimum ?? 0) + i)
          : (it.usages ?? [])
        for (let i = 0; i < count; i++) {
          const u = list[i] ?? list[list.length - 1]
          if (u !== undefined)
            out.push({
              usage: u,
              bit: bit + i * size,
              size,
              min: it.logicalMinimum ?? 0,
              max: it.logicalMaximum ?? (1 << size) - 1,
            })
        }
      }
      bit += size * count
    }
  }
  return out
}

/** Unsigned little-endian read of one field; short reports read as 0. */
export function read(d: DataView, f: Field): number {
  let v = 0
  for (let i = 0; i < f.size; i++) {
    const b = f.bit + i
    const byte = b >> 3
    if (byte >= d.byteLength) break
    if ((d.getUint8(byte) >> (b & 7)) & 1) v |= 1 << i
  }
  return v >>> 0
}

/** Little-endian write of one field into a payload. */
export function write(out: Uint8Array, f: Field, v: number): void {
  for (let i = 0; i < f.size; i++) {
    const b = f.bit + i
    const byte = b >> 3
    if (byte >= out.length) break
    if ((v >> i) & 1) out[byte]! |= 1 << (b & 7)
    else out[byte]! &= ~(1 << (b & 7))
  }
}

export const byUsage = (fs: Field[], u: number): Field | undefined => fs.find((f) => f.usage === u)
export const allByUsage = (fs: Field[], u: number): Field[] => fs.filter((f) => f.usage === u)
