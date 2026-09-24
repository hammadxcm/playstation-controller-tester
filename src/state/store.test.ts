// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import type { HidController } from '@/core/hid/controller'
import { saveLayout, emptyLayout } from '@/core/gamepad/mapping'
import { selectActivePad, selectLanding, useStore } from './store'

const fakeHid = (label: string): HidController => ({
  family: 'dualsense',
  label,
  transport: 'usb',
  device: {} as HIDDevice,
  caps: {
    touchpad: true,
    motion: true,
    battery: true,
    rumble: true,
    lightbar: true,
    lightbarFlash: false,
    playerLeds: true,
    micLed: true,
    adaptiveTriggers: true,
    edge: false,
    impulseTriggers: false,
    paddles: false,
  },
  subscribe: () => () => {},
  rumble: async () => {},
  setLightbar: async () => {},
  setLightbarFlash: async () => {},
  setPlayerLeds: async () => {},
  setMicLed: async () => {},
  setTrigger: async () => {},
  setAudio: async () => {},
  info: async () => ({}),
  factory: async () => ({}),
  close: async () => {},
})

beforeEach(() => useStore.getState().setHid(null))

describe('store', () => {
  it('tracks pads, active index and learned layouts', () => {
    saveLayout('padB', emptyLayout())
    const s = useStore.getState()
    s.setPads([
      { index: 0, id: 'padA', mapping: 'standard' },
      { index: 1, id: 'padB', mapping: '' },
    ])
    expect(useStore.getState().activeIndex).toBe(0)
    s.setActive(1)
    expect(useStore.getState().layout).toBeDefined()
    s.setActive(5)
    expect(useStore.getState().layout).toBeUndefined()
    s.setPads([{ index: 1, id: 'padB', mapping: '' }])
    expect(useStore.getState().activeIndex).toBe(1)
    s.refreshLayout()
    expect(useStore.getState().layout).toBeDefined()
    expect(selectActivePad(useStore.getState())?.id).toBe('padB')
    s.setPads([])
    expect(useStore.getState().activeIndex).toBeNull()
    expect(selectActivePad(useStore.getState())).toBeNull()
    s.refreshLayout()
  })
  it('manages several controllers with per-device output mirrors', async () => {
    const s = useStore.getState()
    s.setHid(fakeHid('a'))
    s.addHid(fakeHid('b'))
    expect(useStore.getState().hids.length).toBe(2)
    expect(useStore.getState().activeHid).toBe(1)
    await useStore.getState().hid!.setLightbar([1, 2, 3])
    await useStore.getState().hid!.setTrigger('right', new Uint8Array([0x26]))
    expect(useStore.getState().hidOut.trigger.right).toBe(0x26)
    expect(useStore.getState().hidOut.lightbar).toEqual([1, 2, 3])
    await useStore.getState().hids[0]!.setLightbar([9, 9, 9])
    expect(useStore.getState().hidOuts[0]!.lightbar).toEqual([9, 9, 9])
    expect(useStore.getState().hidOut.lightbar).toEqual([1, 2, 3])
    await useStore.getState().hid!.setAudio!({
      path: 'speaker',
      headphoneVolume: 0,
      speakerVolume: 1,
      micVolume: 1,
    })
    expect(useStore.getState().hidOut.audio?.path).toBe('speaker')
    expect(await useStore.getState().hid!.factory!()).toEqual({})
    s.setActiveHid(0)
    expect(useStore.getState().hidOut.lightbar).toEqual([9, 9, 9])
    s.setHidOut({ micLed: 'on' })
    expect(useStore.getState().hidOuts[0]!.micLed).toBe('on')
    const stale = useStore.getState().hids[0]!
    s.removeHid(0)
    expect(useStore.getState().hids.length).toBe(1)
    expect(useStore.getState().hid!.label).toBe('b')
    expect(useStore.getState().hidOut.lightbar).toEqual([1, 2, 3])
    await stale.setLightbar([4, 4, 4]) // wrapper of a removed device must not crash
    s.setHid(null)
    await stale.setTrigger('left', new Uint8Array([1])) // stale wrapper, no outputs left
    s.setHid(null)
    await stale.setLightbar([5, 5, 5])
    s.setHid(null)
    s.setHidOut({ micLed: 'pulse' })
    expect(useStore.getState().hidOut.micLed).toBe('pulse')
    s.setHid(fakeHid('b'))
    s.removeHid(0)
    expect(useStore.getState().hid).toBeNull()
    s.setActiveHid(3)
    expect(useStore.getState().hid).toBeNull()
  })
  it('keeps a bounded HID log, settings and report', () => {
    const s = useStore.getState()
    for (let i = 0; i < 120; i++) s.pushHidLog({ t: i, dir: 'info' })
    expect(useStore.getState().hidLog.length).toBe(100)
    s.clearHidLog()
    expect(useStore.getState().hidLog).toEqual([])
    expect(useStore.getState().settings.theme).toBe('system')
    expect(useStore.getState().settings.lang).toBe('auto')
    s.setSettings({ theme: 'light' })
    expect(useStore.getState().settings.theme).toBe('light')
    s.setReport({
      at: 'now',
      padId: 'x',
      score: {
        score: 1,
        grade: 'F',
        breakdown: {
          driftMagnitude: 0,
          circularityErrorPct: 0,
          resolutionBits: 0,
          pollingHz: 0,
          chatterEvents: 0,
          stuckButtons: 0,
        },
      },
      metrics: {},
    })
    expect(useStore.getState().report?.score.grade).toBe('F')
  })
  it('shows the landing until a pad, a HID device or the user enters the shell', () => {
    expect(selectLanding({ pads: [], hids: [], entered: false })).toBe(true)
    expect(
      selectLanding({
        pads: [{ index: 0, id: 'x', mapping: 'standard' }],
        hids: [],
        entered: false,
      }),
    ).toBe(false)
    expect(selectLanding({ pads: [], hids: [{} as never], entered: false })).toBe(false)
    useStore.getState().setEntered(true)
    expect(selectLanding(useStore.getState())).toBe(false)
    useStore.getState().setEntered(false)
  })
})
