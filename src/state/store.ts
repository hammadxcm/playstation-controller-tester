import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { HidController } from '@/core/hid/controller'
import { getLayout, type Layout } from '@/core/gamepad/mapping'
import type { ScoreResult } from '@/core/analysis'
import { EMPTY_OUTPUT, trackOutput, type HidOutput } from './hidOutput'
import type { HidLogEntry } from '@/core/hid/log'
import type { ThemeSetting } from '@/lib/theme'

export interface PadInfo {
  index: number
  id: string
  mapping: string
}

export interface WizardReport {
  at: string
  padId: string
  score: ScoreResult
  metrics: Record<string, number | string | boolean>
}

export interface Settings {
  deadzone: number
  trace: 'fade' | 'constant' | 'none'
  theme: ThemeSetting
}

interface Store {
  pads: PadInfo[]
  activeIndex: number | null
  layout: Layout | undefined
  /** every connected Pro Mode controller, wrapped for output mirroring */
  hids: HidController[]
  activeHid: number
  /** the active controller (derived, kept for convenience) */
  hid: HidController | null
  /** last commanded output per controller, indexed like `hids` */
  hidOuts: HidOutput[]
  hidOut: HidOutput
  hidLog: HidLogEntry[]
  report: WizardReport | null
  settings: Settings
  /** user left the landing page for the shell without a device (Pro Mode, Report); session-only */
  entered: boolean
  setPads(pads: PadInfo[]): void
  setActive(index: number): void
  refreshLayout(): void
  /** add (or replace all with) a controller and make it active */
  setHid(h: HidController | null): void
  addHid(h: HidController): void
  removeHid(index: number): void
  setActiveHid(index: number): void
  setHidOut(patch: Partial<HidOutput>): void
  pushHidLog(e: HidLogEntry): void
  clearHidLog(): void
  setReport(r: WizardReport | null): void
  setSettings(s: Partial<Settings>): void
  setEntered(v: boolean): void
}

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      pads: [],
      activeIndex: null,
      layout: undefined,
      hids: [],
      activeHid: 0,
      hid: null,
      hidOuts: [],
      hidOut: EMPTY_OUTPUT,
      hidLog: [],
      report: null,
      settings: { deadzone: 0.05, trace: 'fade', theme: 'system' },
      entered: false,
      setPads(pads) {
        const cur = get().activeIndex
        const active = pads.find((p) => p.index === cur) ?? pads[0]
        set({ pads, activeIndex: active?.index ?? null, layout: active ? getLayout(active.id) : undefined })
      },
      setActive(index) {
        const pad = get().pads.find((p) => p.index === index)
        set({ activeIndex: index, layout: pad ? getLayout(pad.id) : undefined })
      },
      refreshLayout() {
        const pad = get().pads.find((p) => p.index === get().activeIndex)
        set({ layout: pad ? getLayout(pad.id) : undefined })
      },
      setHid(h) {
        if (!h) {
          set({ hids: [], hidOuts: [], activeHid: 0, hid: null, hidOut: EMPTY_OUTPUT })
          return
        }
        set({ hids: [], hidOuts: [], activeHid: 0 })
        get().addHid(h)
      },
      addHid(h) {
        const index = get().hids.length
        const wrapped = trackOutput(
          h,
          (p) => {
            const outs = [...get().hidOuts]
            outs[index] = { ...(outs[index] ?? EMPTY_OUTPUT), ...p }
            set({ hidOuts: outs, hidOut: get().activeHid === index ? outs[index]! : get().hidOut })
          },
          () => get().hidOuts[index] ?? EMPTY_OUTPUT,
        )
        set({ hids: [...get().hids, wrapped], hidOuts: [...get().hidOuts, EMPTY_OUTPUT], activeHid: index, hid: wrapped, hidOut: EMPTY_OUTPUT })
      },
      removeHid(i) {
        const hids = get().hids.filter((_, k) => k !== i)
        const hidOuts = get().hidOuts.filter((_, k) => k !== i)
        // ponytail: indices shift after removal; wrappers captured their index, so re-wrap the survivors
        set({ hids: [], hidOuts: [], activeHid: 0, hid: null, hidOut: EMPTY_OUTPUT })
        hids.forEach((h, k) => {
          get().addHid(h)
          const outs = [...get().hidOuts]
          outs[k] = hidOuts[k]!
          set({ hidOuts: outs })
        })
        const active = Math.min(get().activeHid, hids.length - 1)
        if (hids.length) get().setActiveHid(active)
      },
      setActiveHid(i) {
        const hid = get().hids[i] ?? null
        set({ activeHid: i, hid, hidOut: get().hidOuts[i] ?? EMPTY_OUTPUT })
      },
      setHidOut(patch) {
        const i = get().activeHid
        const outs = [...get().hidOuts]
        outs[i] = { ...(outs[i] ?? EMPTY_OUTPUT), ...patch }
        set({ hidOuts: outs, hidOut: outs[i]! })
      },
      pushHidLog: (e) => set({ hidLog: [...get().hidLog.slice(-99), e] }),
      clearHidLog: () => set({ hidLog: [] }),
      setReport: (report) => set({ report }),
      setSettings: (s) => set({ settings: { ...get().settings, ...s } }),
      setEntered: (entered) => set({ entered }),
    }),
    { name: `ct${import.meta.env.BASE_URL}settings`, partialize: (s) => ({ settings: s.settings, report: s.report }) },
  ),
)

export const selectActivePad = (s: Pick<Store, 'pads' | 'activeIndex'>): PadInfo | null => s.pads.find((p) => p.index === s.activeIndex) ?? null
/** Landing page is the front door until a Gamepad-API pad or WebHID device shows up, or the user enters the shell. */
export const selectLanding = (s: Pick<Store, 'pads' | 'hids' | 'entered'>): boolean => s.pads.length === 0 && s.hids.length === 0 && !s.entered
