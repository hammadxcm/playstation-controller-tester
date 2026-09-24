import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { FakeHidDevice } from '@/testing/fakeHidDevice'
import type { HidController } from '../controller'
import { MICROSOFT } from '../../gamepad/identify'
import {
  allByUsage,
  byUsage,
  fields,
  read,
  reportIds,
  usage,
  write,
  type Field,
} from './descriptor'
import {
  emptyState,
  hasBattery,
  layoutOf,
  mapFields,
  parseBattery,
  parseXbox,
  XBOX_BUTTONS,
} from './input'
import { encodeRumble, ENABLE_ALL, RUMBLE_REPORT } from './output'
import { RUMBLE_GAP_MS, XboxDevice } from './device'

// --- descriptor builders -------------------------------------------------------------------------

type ItemSpec = Partial<HIDReportItem> & { size: number; count?: number }
const item = ({ size, count = 1, ...rest }: ItemSpec): HIDReportItem =>
  ({
    reportSize: size,
    reportCount: count,
    isConstant: false,
    isArray: false,
    isRange: false,
    ...rest,
  }) as HIDReportItem
const pad = (bits: number) => item({ size: bits, isConstant: true })
const axis16 = (...us: number[]) =>
  item({ size: 16, count: us.length, usages: us, logicalMinimum: 0, logicalMaximum: 65535 })
const axis10 = (u: number) =>
  item({ size: 10, usages: [u], logicalMinimum: 0, logicalMaximum: 1023 })
const hat = () =>
  item({ size: 4, usages: [usage(1, 0x39)], logicalMinimum: 1, logicalMaximum: 8, hasNull: true })
const buttons = (n: number) =>
  item({ size: 1, count: n, isRange: true, usageMinimum: usage(9, 1), usageMaximum: usage(9, n) })
const bit = (u: number) => item({ size: 1, usages: [u], logicalMinimum: 0, logicalMaximum: 1 })
const report = (reportId: number, items: HIDReportItem[]) =>
  ({ reportId, items }) as unknown as HIDReportInfo
const col = (
  inputReports: HIDReportInfo[],
  outputReports: HIDReportInfo[] = [],
  children: HIDCollectionInfo[] = [],
) =>
  ({
    usagePage: 1,
    usage: 5,
    type: 1,
    children,
    inputReports,
    outputReports,
    featureReports: [],
  }) as unknown as HIDCollectionInfo

const PID_PAGE = 0x0f
const mag = () =>
  item({
    size: 8,
    count: 4,
    usages: [usage(PID_PAGE, 0x70)],
    logicalMinimum: 0,
    logicalMaximum: 100,
  })
const u8 = (u: number) => item({ size: 8, usages: [u], logicalMinimum: 0, logicalMaximum: 255 })

/** BLE firmware 5.x (Series X|S, Elite 2 2021, One S 2021): Rx/Ry stick, Z/Rz 10-bit triggers, buttons 1..16 */
const SPARSE = () => [
  col(
    [
      report(1, [
        axis16(usage(1, 0x30), usage(1, 0x31)),
        axis16(usage(1, 0x33), usage(1, 0x34)),
        axis10(usage(1, 0x32)),
        pad(6),
        axis10(usage(1, 0x35)),
        pad(6),
        hat(),
        pad(4),
        buttons(16),
        bit(usage(0x0c, 0x224)),
        bit(usage(0x0c, 0xb2)),
        item({ size: 4, usages: [usage(0x0c, 0x81)], logicalMinimum: 0, logicalMaximum: 15 }),
        item({ size: 2, usages: [usage(0x0c, 0x85)], logicalMinimum: 0, logicalMaximum: 3 }),
        item({ size: 4, usages: [usage(0x0c, 0x99)], logicalMinimum: 0, logicalMaximum: 15 }),
      ]),
      report(4, [u8(usage(6, 0x20))]),
    ],
    [
      // duration / loop / delay deliberately in the "Series" order to prove usage-driven encoding
      report(3, [
        item({ size: 4, usages: [usage(PID_PAGE, 0x97)], logicalMinimum: 0, logicalMaximum: 15 }),
        pad(4),
        mag(),
        u8(usage(PID_PAGE, 0x50)),
        u8(usage(PID_PAGE, 0xa7)),
        u8(usage(PID_PAGE, 0x7c)),
      ]),
    ],
  ),
]

/** Pre-2021 firmware (0x02e0): Z/Rz stick, Simulation-page triggers, buttons 1..10, Xbox button on report 2 */
const DENSE = () => [
  col(
    [
      report(1, [
        axis16(usage(1, 0x30), usage(1, 0x31), usage(1, 0x32), usage(1, 0x35)),
        axis10(usage(2, 0xc5)),
        pad(6),
        axis10(usage(2, 0xc4)),
        pad(6),
        hat(),
        pad(4),
        buttons(10),
        pad(6),
      ]),
    ],
    [],
    [col([report(2, [bit(usage(1, 0x85)), pad(7)])])],
  ),
]

function pack(fs: Field[], values: Record<number, number | number[]>, bytes: number): Uint8Array {
  const out = new Uint8Array(bytes)
  for (const [u, v] of Object.entries(values)) {
    const list = allByUsage(fs, Number(u))
    const vs = Array.isArray(v) ? v : [v]
    vs.forEach((x, i) => write(out, list[i]!, x))
  }
  return out
}

const dev = (
  cols: HIDCollectionInfo[],
  pid = 0x0b13,
  vid = MICROSOFT,
  name = 'Xbox Wireless Controller',
) => new FakeHidDevice(vid, pid, name, { collections: cols })

// --- descriptor ---------------------------------------------------------------------------------

describe('descriptor', () => {
  it('walks nested collections, ranges, repeated usages, padding and arrays', () => {
    const cols = [
      col(
        [
          report(1, [
            buttons(3),
            item({ size: 2, count: 2, isArray: true, usages: [1] }),
            item({ size: 8, count: 2, usages: [7, 8] }),
            item({ size: 4, count: 2, usages: [9] }),
            item({ size: 3, count: 1 }),
          ]),
        ],
        [],
        [col([report(2, [bit(5)])])],
      ),
    ]
    const fs = fields(dev(cols).asHid(), 1)
    expect(fs.map((f) => [f.usage, f.bit, f.size])).toEqual([
      [usage(9, 1), 0, 1],
      [usage(9, 2), 1, 1],
      [usage(9, 3), 2, 1],
      [7, 7, 8],
      [8, 15, 8],
      [9, 23, 4],
      [9, 27, 4],
    ])
    expect(fs[3]!.max).toBe(255)
    expect(fields(dev(cols).asHid(), 2)).toHaveLength(1)
    expect(fields(dev(cols).asHid(), 9)).toEqual([])
    expect(fields(dev([{ children: [] } as unknown as HIDCollectionInfo]).asHid(), 1)).toEqual([])
    expect(fields(dev([col([{ reportId: 1 } as unknown as HIDReportInfo])]).asHid(), 1)).toEqual([])
    expect(fields(dev([col([report(0, [item({ size: 8 })])])]).asHid(), 0)).toEqual([])
    expect(
      fields(dev([col([{ items: [bit(4)] } as unknown as HIDReportInfo])]).asHid(), 0),
    ).toHaveLength(1)
    expect(fields(dev([col([report(1, [{} as HIDReportItem])])]).asHid(), 1)).toEqual([])
    const bare = { inputReports: [report(7, [item({ size: 1, count: 2, isRange: true })])] }
    expect(
      fields(dev([bare as unknown as HIDCollectionInfo]).asHid(), 7).map((f) => f.usage),
    ).toEqual([0, 1])
    expect(
      reportIds(dev([bare as unknown as HIDCollectionInfo, col([report(1, [])])]).asHid()),
    ).toEqual([7, 1])
  })
  it('reads and writes little-endian bit fields, tolerating short buffers', () => {
    const f: Field = { usage: 0, bit: 4, size: 12, min: 0, max: 4095 }
    const out = new Uint8Array(2)
    write(out, f, 0xabc)
    expect(Array.from(out)).toEqual([0xc0, 0xab])
    expect(read(new DataView(out.buffer), f)).toBe(0xabc)
    write(out, f, 0)
    expect(Array.from(out)).toEqual([0, 0])
    expect(read(new DataView(new Uint8Array(1).buffer), f)).toBe(0)
    write(new Uint8Array(1), f, 0xfff)
    expect(byUsage([f], 1)).toBeUndefined()
  })
})

// --- input --------------------------------------------------------------------------------------

describe('input', () => {
  it('tells the two button layouts apart and resolves axes by size', () => {
    const sp = fields(dev(SPARSE()).asHid(), 1)
    const de = fields(dev(DENSE()).asHid(), 1)
    expect(layoutOf(sp)).toBe('sparse')
    expect(layoutOf(de)).toBe('dense')
    const ms = mapFields(sp)
    expect(ms.rx?.usage).toBe(usage(1, 0x33))
    expect(ms.lt?.usage).toBe(usage(1, 0x32))
    expect(ms.rt?.usage).toBe(usage(1, 0x35))
    expect(ms.buttons.x?.[0]?.usage).toBe(usage(9, 4))
    expect(ms.buttons.share?.map((f) => f.usage)).toEqual([usage(9, 16), usage(0x0c, 0xb2)])
    expect(ms.buttons.back?.map((f) => f.usage)).toEqual([usage(9, 11), usage(0x0c, 0x224)])
    expect(ms.paddles).toBeDefined()
    const md = mapFields(de)
    expect(md.rx?.usage).toBe(usage(1, 0x32))
    expect(md.ry?.usage).toBe(usage(1, 0x35))
    expect(md.lt?.usage).toBe(usage(2, 0xc5))
    expect(md.rt?.usage).toBe(usage(2, 0xc4))
    expect(md.buttons.x?.[0]?.usage).toBe(usage(9, 3))
    expect(md.buttons.xbox).toBeUndefined()
    expect(mapFields(fields(dev(DENSE()).asHid(), 2)).buttons.xbox?.[0]?.usage).toBe(usage(1, 0x85))
    expect(hasBattery(fields(dev(SPARSE()).asHid(), 4))).toBe(true)
    expect(hasBattery(de)).toBe(false)
    expect(mapFields([]).layout).toBe('dense')
  })
  it('parses sticks, triggers, hat, buttons, paddles and profile, keeping values across reports', () => {
    const fs = fields(dev(SPARSE()).asHid(), 1)
    const m = mapFields(fs)
    const bytes = pack(
      fs,
      {
        [usage(1, 0x30)]: 65535,
        [usage(1, 0x31)]: 0,
        [usage(1, 0x33)]: 32768,
        [usage(1, 0x34)]: 65535,
        [usage(1, 0x32)]: 1023,
        [usage(1, 0x35)]: 512,
        [usage(1, 0x39)]: 3,
        [usage(9, 1)]: 1,
        [usage(9, 16)]: 1,
        [usage(0x0c, 0x81)]: 0b1010,
        [usage(0x0c, 0x85)]: 2,
        [usage(0x0c, 0x99)]: 5,
      },
      18,
    )
    const s = parseXbox(m, new DataView(bytes.buffer), emptyState(0), 1, 5)
    expect(s.sticks).toEqual({ lx: 255, ly: 0, rx: 128, ry: 255 })
    expect(s.triggers).toEqual({ l2: 255, r2: 128 })
    expect(s.hat).toBe(2)
    expect(s.buttons).toMatchObject({
      a: true,
      b: false,
      share: true,
      xbox: false,
      p1: false,
      p2: true,
      p3: false,
      p4: true,
    })
    expect(s.extra).toMatchObject({ profile: 2, layout: true, triggerScale: 5 })
    expect(s.reportId).toBe(1)
    expect(s.t).toBe(5)
    expect(s.raw.length).toBe(18)
    // share through the consumer alias, hat centred, report id carried
    const b2 = pack(fs, { [usage(0x0c, 0xb2)]: 1, [usage(1, 0x39)]: 0 }, 18)
    const s2 = parseXbox(m, new DataView(b2.buffer), s, 1, 6)
    expect(s2.buttons.share).toBe(true)
    expect(s2.hat).toBe(8)
    expect(s2.sticks.lx).toBe(0)
    // dense: the Xbox button lives on report 2 and must not disturb the rest of the state
    const dfs = fields(dev(DENSE()).asHid(), 1)
    const dm = mapFields(dfs)
    const d1 = parseXbox(
      dm,
      new DataView(pack(dfs, { [usage(1, 0x30)]: 65535, [usage(2, 0xc5)]: 1023 }, 16).buffer),
      emptyState(0),
      1,
      1,
    )
    expect(d1.sticks.lx).toBe(255)
    expect(d1.triggers.l2).toBe(255)
    expect(d1.buttons.xbox).toBeUndefined()
    expect(d1.extra.layout).toBe(false)
    const m2 = mapFields(fields(dev(DENSE()).asHid(), 2))
    const d2 = parseXbox(m2, new DataView(new Uint8Array([1]).buffer), d1, 2, 2)
    expect(d2.buttons.xbox).toBe(true)
    expect(d2.sticks.lx).toBe(255)
    expect(d2.reportId).toBe(2)
    expect(XBOX_BUTTONS).toHaveLength(12)
  })
  it('decodes the battery byte', () => {
    expect(parseBattery(0x00)).toEqual({ battery: { percent: 0, state: 'unknown' }, usb: false })
    expect(parseBattery(0x80 | 0x04 | 0)).toEqual({
      battery: { percent: 10, state: 'discharging' },
      usb: false,
    })
    expect(parseBattery(0x80 | 0x04 | 3)).toEqual({
      battery: { percent: 100, state: 'discharging' },
      usb: false,
    })
    expect(parseBattery(0x80 | 0x08 | 0x10 | 1)).toEqual({
      battery: { percent: 40, state: 'charging' },
      usb: true,
    })
    expect(parseBattery(0x80 | 0x00 | 2)).toEqual({
      battery: { percent: 70, state: 'full' },
      usb: true,
    })
  })
})

// --- output -------------------------------------------------------------------------------------

describe('output', () => {
  it('encodes the fixed layout with clamped percentages', () => {
    expect(Array.from(encodeRumble({ strong: 1, weak: 0.5, left: 2, right: -1 }))).toEqual([
      ENABLE_ALL,
      100,
      0,
      100,
      50,
      0xff,
      0,
      0xff,
    ])
    expect(Array.from(encodeRumble({ strong: 0, weak: 0, left: 0, right: 0 }, []))).toEqual([
      ENABLE_ALL,
      0,
      0,
      0,
      0,
      0xff,
      0,
      0xff,
    ])
  })
  it('writes by usage when the descriptor declares the fields, whatever their order', () => {
    const fs = fields(dev(SPARSE()).asHid(), RUMBLE_REPORT, 'output')
    const b = encodeRumble({ strong: 0.25, weak: 1, left: 0.1, right: 0.2 }, fs)
    expect(Array.from(b)).toEqual([ENABLE_ALL, 10, 20, 25, 100, 0xff, 0xff, 0])
    const timing = [usage(PID_PAGE, 0x50), usage(PID_PAGE, 0x7c), usage(PID_PAGE, 0xa7)]
    const partial = fs.filter((f) => !timing.includes(f.usage))
    expect(
      Array.from(encodeRumble({ strong: 0, weak: 0, left: 0, right: 0 }, partial)).slice(5),
    ).toEqual([0, 0, 0])
  })
})

// --- device -------------------------------------------------------------------------------------

describe('XboxDevice', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('labels by product id, reads caps from the descriptor and parses input and battery reports', async () => {
    const f = dev(SPARSE(), 0x0b22)
    const log: string[] = []
    const x = new XboxDevice(f.asHid(), (e) => log.push(`${e.dir}:${e.note ?? ''}`))
    expect(x.label).toBe('Xbox Elite Series 2')
    expect(x.family).toBe('xbox')
    expect(x.transport).toBe('bt')
    expect(x.caps.battery).toBe(false)
    await x.open()
    expect(f.opened).toBe(true)
    expect(x.caps).toMatchObject({
      battery: true,
      paddles: true,
      impulseTriggers: true,
      rumble: true,
      lightbar: false,
    })
    expect(log[0]).toContain('layout=sparse')
    expect(log[0]).toContain('paddles')
    const seen: number[] = []
    const off = x.subscribe((s) => seen.push(s.reportId))
    const fs = fields(f.asHid(), 1)
    f.input(1, pack(fs, { [usage(9, 2)]: 1 }, 18))
    f.input(4, new Uint8Array([0x80 | 0x04 | 3]))
    f.input(9, new Uint8Array([1, 2, 3]))
    f.input(4, new Uint8Array(0))
    expect(seen).toEqual([1, 1])
    off()
    f.input(1, pack(fs, {}, 18))
    expect(seen).toEqual([1, 1])
    await expect(x.info()).resolves.toMatchObject({
      product: 'Xbox Elite Series 2',
      productId: '0x0b22',
      layout: 'sparse',
      reports: '0x01',
      rumbleFields: 'descriptor',
    })
    const c: HidController = x
    await c.setLightbar(null)
    await c.setLightbarFlash(0, 0)
    await c.setPlayerLeds(0, 0)
    await c.setMicLed('off')
    await c.setTrigger('left', new Uint8Array())
    await x.close()
    expect(f.opened).toBe(false)
    expect(f.sent.at(-1)).toMatchObject({ id: RUMBLE_REPORT })
    expect(Array.from(f.sent.at(-1)!.data).slice(1, 5)).toEqual([0, 0, 0, 0])
  })
  it('falls back to product name, fixed rumble layout and report 4 battery on old descriptors', async () => {
    const f = dev(DENSE(), 0x1234, MICROSOFT, 'Some Xbox pad')
    const x = new XboxDevice(f.asHid())
    expect(x.label).toBe('Some Xbox pad')
    expect(new XboxDevice(dev(DENSE(), 0x0b13, 0x1234, '').asHid()).label).toBe('Xbox controller')
    f.opened = true
    await x.open()
    expect(x.caps.paddles).toBe(false)
    let last = emptyState(0)
    x.subscribe((s) => (last = s))
    f.input(2, new Uint8Array([1]))
    expect(last.buttons.xbox).toBe(true)
    f.input(4, new Uint8Array([0x80 | 0x08 | 0x10 | 2]))
    expect(last.battery).toEqual({ percent: 70, state: 'charging' })
    expect(last.flags.usb).toBe(true)
    await expect(x.info()).resolves.toMatchObject({
      layout: 'dense',
      rumbleFields: 'fixed',
      reports: '0x01, 0x02',
    })
    await x.rumble(1, 0.5, 0.25, 0.75)
    expect(Array.from(f.sent[0]!.data)).toEqual([ENABLE_ALL, 25, 75, 100, 50, 0xff, 0, 0xff])
    f.opened = false
    await x.close()
    expect(f.sent).toHaveLength(1)
  })
  it('coalesces rumble bursts, spaces packets and surfaces send failures', async () => {
    const f = dev(SPARSE())
    const log: string[] = []
    const x = new XboxDevice(f.asHid(), (e) => log.push(e.dir))
    await x.open()
    const p1 = x.rumble(1, 0)
    const p2 = x.rumble(0.5, 0)
    const p3 = x.rumble(0.2, 0)
    await vi.advanceTimersByTimeAsync(0)
    expect(f.sent).toHaveLength(1)
    expect(f.sent[0]!.data[3]).toBe(100)
    await vi.advanceTimersByTimeAsync(RUMBLE_GAP_MS)
    await Promise.all([p1, p2, p3])
    expect(f.sent).toHaveLength(2)
    expect(f.sent[1]!.data[3]).toBe(20)
    f.failSend = new Error('gone')
    const p4 = x.rumble(0, 0).catch((e: Error) => e.message)
    await vi.advanceTimersByTimeAsync(RUMBLE_GAP_MS)
    expect(await p4).toBe('gone')
    expect(log).toContain('error')
    await expect(x.close()).resolves.toBeUndefined()
    const odd = new XboxDevice(dev([col([report(5, [buttons(3)])])]).asHid())
    await odd.open()
    expect((await odd.info()).layout).toBe('unknown')
  })
})
