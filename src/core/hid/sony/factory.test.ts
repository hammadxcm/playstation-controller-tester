import { describe, expect, it } from 'vitest'
import { FakeHidDevice } from '@/testing/fakeHidDevice'
import { readFactoryInfo } from './factory'
import { sendFeature, testCommand } from './testCommand'
import type { HidLogEntry } from '../log'

/** 0x81 response page: [0x81, deviceId, actionId, status, ...payload] */
const page = (dev: number, act: number, status: number, payload: number[]) => {
  const b = new Uint8Array(64)
  b.set([0x81, dev, act, status])
  b.set(payload, 4)
  return b
}

function fake() {
  const f = new FakeHidDevice(0x054c, 0x0ce6, 'DualSense')
  const log: HidLogEntry[] = []
  return { f, log, t: { device: f.asHid(), transport: 'usb' as const, log: (e: HidLogEntry) => log.push(e) } }
}

describe('testCommand', () => {
  it('writes 0x80 and collects a single-page result', async () => {
    const { f, t } = fake()
    f.featureSequence.set(0x81, [page(1, 19, 1, []), page(1, 19, 2, [0x41, 0x42, 0x43])])
    const out = await testCommand(t, 1, 19, 3, 0)
    expect(f.featureSent[0]).toMatchObject({ id: 0x80 })
    expect(Array.from(f.featureSent[0]!.data.subarray(0, 2))).toEqual([1, 19])
    expect(Array.from(out!)).toEqual([0x41, 0x42, 0x43])
  })
  it('joins multi-page results (COMPLETE_2 then COMPLETE)', async () => {
    const { f, t } = fake()
    const first = Array.from({ length: 56 }, (_, i) => i)
    f.featureSequence.set(0x81, [page(1, 21, 3, first), page(1, 21, 2, [200, 201])])
    const out = await testCommand(t, 1, 21, 58, 0)
    expect(out!.length).toBe(58)
    expect(out![55]).toBe(55)
    expect(out![57]).toBe(201)
  })
  it('ignores responses for other commands and gives up on TIMEOUT status', async () => {
    const { f, t, log } = fake()
    f.featureSequence.set(0x81, [page(9, 9, 2, [1]), page(1, 4, 255, [])])
    expect(await testCommand(t, 1, 4, 6, 0)).toBeNull()
    expect(log.at(-1)?.note).toContain('timed out')
  })
  it('returns null when the command write or the poll fails', async () => {
    const { f, t, log } = fake()
    f.failFeature = new Error('NotAllowedError')
    expect(await testCommand(t, 1, 4, 6, 0)).toBeNull()
    expect(log.at(-1)?.dir).toBe('error')
    const g = fake()
    expect(await testCommand(g.t, 1, 4, 6, 0)).toBeNull() // no 0x81 available → receive throws
  })
  it('pads Bluetooth feature reports and appends a CRC', async () => {
    const { f, t } = fake()
    await sendFeature({ ...t, transport: 'bt' }, 0x80, new Uint8Array([1, 2]))
    const sent = f.featureSent[0]!.data
    expect(sent.length).toBe(77)
    expect(sent.subarray(73).some((b) => b !== 0)).toBe(true)
  })
})

describe('readFactoryInfo', () => {
  it('decodes every field from canned pages', async () => {
    const { f, t } = fake()
    const serial = Array.from('ABC1234567', (c) => c.charCodeAt(0))
    f.featureSequence.set(0x81, [
      page(1, 19, 2, serial),
      page(1, 4, 2, [0x66, 0x55, 0x44, 0x33, 0x22, 0x11]),
      page(1, 9, 2, [0, 8, 7, 6, 5, 4, 3, 2, 1]),
      page(9, 2, 2, [0x66, 0x55, 0x44, 0x33, 0x22, 0x11]),
      page(4, 3, 2, [0x2c, 0x10, 0, 0]),
      page(5, 2, 2, [1, 2, 3, 4, 5, 6, 7, 8]),
      page(5, 4, 2, [0, 0, 0, 1, 0, 0, 0, 2]),
      page(1, 21, 2, Array.from('parts', (c) => c.charCodeAt(0))),
      page(1, 24, 2, [0xde, 0xad]),
    ])
    const info = await readFactoryInfo(t)
    expect(info).toEqual({
      serial: 'ABC1234567',
      pcbaId: '112233445566',
      mcuUniqueId: '0102030405060708',
      btAddress: '11:22:33:44:55:66',
      batteryMv: 4140,
      touchpadId: '0102030405060708',
      touchpadFirmware: '0000000100000002',
      assembleParts: 'parts',
      batteryBarcode: 'dead',
    })
  })
  it('leaves fields undefined when commands fail', async () => {
    const { t } = fake()
    expect(await readFactoryInfo(t)).toEqual({})
  })
})
