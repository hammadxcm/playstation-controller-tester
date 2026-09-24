import { describe, expect, it } from 'vitest'
import { FakeHidDevice } from '@/testing/fakeHidDevice'
import { sendFeature, testCommand } from './testCommand'
import { readFactoryInfo } from './factory'

const page = (dev: number, act: number, status: number, payload: number[], withId = true) => {
  const b = new Uint8Array(64)
  if (withId) b.set([0x81, dev, act, status], 0)
  else b.set([dev, act, status], 0)
  b.set(payload, withId ? 4 : 3)
  return b
}

describe('testCommand branches', () => {
  it('uses the descriptor feature length when present and responses without the id byte', async () => {
    const f = new FakeHidDevice(0x054c, 0x0ce6, 'DS')
    const bare = new FakeHidDevice(0x054c, 0x0ce6, 'DS')
    ;(bare.collections[0] as unknown as { featureReports?: unknown }).featureReports = undefined
    await sendFeature({ device: bare.asHid(), transport: 'usb' }, 0x80, new Uint8Array([1]))
    expect(bare.featureSent[0]!.data.length).toBe(63)
    ;(f.collections[0] as unknown as { featureReports: unknown[] }).featureReports = [
      { reportId: 0x80, items: [{ reportCount: 20 }] },
      { reportId: 0x99, items: [] },
      { reportId: 0x98 },
      { reportId: 0x97, items: [{}] },
    ]
    await sendFeature({ device: f.asHid(), transport: 'usb' }, 0x80, new Uint8Array([1]))
    expect(f.featureSent[0]!.data.length).toBe(20)
    await sendFeature({ device: f.asHid(), transport: 'usb' }, 0x99, new Uint8Array([1]))
    expect(f.featureSent[1]!.data.length).toBe(63)
    await sendFeature({ device: f.asHid(), transport: 'usb' }, 0x98, new Uint8Array([1]))
    await sendFeature({ device: f.asHid(), transport: 'usb' }, 0x97, new Uint8Array([1]))
    expect(f.featureSent[3]!.data.length).toBe(63)
    f.featureSequence.set(0x81, [page(1, 19, 1, [], false), page(1, 19, 2, [65], false)])
    const out = await testCommand({ device: f.asHid(), transport: 'usb' }, 1, 19, 1, 0)
    expect(out![0]).toBe(65)
  })
  it('keeps polling while the command is running, then fails on receive error mid-way', async () => {
    const f = new FakeHidDevice(0x054c, 0x0ce6, 'DS')
    f.featureSequence.set(0x81, [page(1, 4, 1, [])])
    expect(await testCommand({ device: f.asHid(), transport: 'usb' }, 1, 4, 6, 0)).toBeNull()
  })
  it('readFactoryInfo skips the unique id when the status byte is non-zero and hex-encodes binary parts', async () => {
    const f = new FakeHidDevice(0x054c, 0x0ce6, 'DS')
    f.featureSequence.set(0x81, [
      page(1, 19, 2, []),
      page(1, 4, 2, [1, 2, 3, 4, 5, 6]),
      page(1, 9, 2, [1, 0, 0, 0, 0, 0, 0, 0, 0]),
      page(9, 2, 2, [1, 2, 3, 4, 5, 6]),
      page(4, 3, 2, [0, 0, 0, 0]),
      page(5, 2, 2, []),
      page(5, 4, 2, []),
      page(1, 21, 2, [0xde, 0xad, 0]),
      page(1, 24, 2, [0, 0]),
    ])
    const info = await readFactoryInfo({ device: f.asHid(), transport: 'usb' })
    expect(info.mcuUniqueId).toBeUndefined()
    expect(info.assembleParts).toBe('dead')
    expect(info.batteryBarcode).toBe('')
    expect(info.serial).toBe('')
  })
})
