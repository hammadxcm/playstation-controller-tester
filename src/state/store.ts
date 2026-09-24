import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { HidController } from '@/core/hid/controller'
import { getLayout, type Layout } from '@/core/gamepad/mapping'
import type { ScoreResult } from '@/core/analysis'

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
  theme: 'dark' | 'light'
}

interface Store {
  pads: PadInfo[]
  activeIndex: number | null
  layout: Layout | undefined
  hid: HidController | null
  report: WizardReport | null
  settings: Settings
  setPads(pads: PadInfo[]): void
  setActive(index: number): void
  refreshLayout(): void
  setHid(h: HidController | null): void
  setReport(r: WizardReport | null): void
  setSettings(s: Partial<Settings>): void
}

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      pads: [],
      activeIndex: null,
      layout: undefined,
      hid: null,
      report: null,
      settings: { deadzone: 0.05, trace: 'fade', theme: 'dark' },
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
      setHid: (hid) => set({ hid }),
      setReport: (report) => set({ report }),
      setSettings: (s) => set({ settings: { ...get().settings, ...s } }),
    }),
    { name: 'ct:settings', partialize: (s) => ({ settings: s.settings, report: s.report }) },
  ),
)

export const useActivePad = () => useStore((s) => s.pads.find((p) => p.index === s.activeIndex) ?? null)
