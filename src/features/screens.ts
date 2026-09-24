import { lazy, type ComponentType } from 'react'

export const TAB_IDS = [
  'overview',
  'sticks',
  'triggers',
  'buttons',
  'haptics',
  'wizard',
  'pro',
  'learn',
  'report',
] as const
export type Tab = (typeof TAB_IDS)[number]

// ponytail: one chunk per screen so the landing's first paint doesn't pay for Pro Mode's audio graph and console
const LOADERS: Record<Tab, () => Promise<{ default: ComponentType }>> = {
  overview: () => import('@/features/overview/Overview').then((x) => ({ default: x.Overview })),
  sticks: () => import('@/features/sticks/Sticks').then((x) => ({ default: x.Sticks })),
  triggers: () => import('@/features/triggers/Triggers').then((x) => ({ default: x.Triggers })),
  buttons: () => import('@/features/buttons/Buttons').then((x) => ({ default: x.Buttons })),
  haptics: () => import('@/features/haptics/Haptics').then((x) => ({ default: x.Haptics })),
  wizard: () => import('@/features/wizard/Wizard').then((x) => ({ default: x.Wizard })),
  pro: () => import('@/features/pro/Pro').then((x) => ({ default: x.Pro })),
  learn: () => import('@/features/learn/Learn').then((x) => ({ default: x.Learn })),
  report: () => import('@/features/report/Report').then((x) => ({ default: x.Report })),
}

export const SCREENS = Object.fromEntries(
  TAB_IDS.map((id) => [id, lazy(LOADERS[id])]),
) as unknown as Record<Tab, ComponentType>

/** Warm a screen's chunk (tile hover, tab focus); dynamic imports are cached so the later render is instant. */
export const preloadScreen = (tab: Tab): Promise<unknown> => LOADERS[tab]()
