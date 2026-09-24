import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { onFrames, onPads } from '@/core/gamepad/poller'
import { applyLayout } from '@/core/gamepad/mapping'
import type { Frame } from '@/core/gamepad/types'
import type { HidState } from '@/core/hid/controller'
import { reopenGranted, requestController, webHidSupported } from '@/core/hid/registry'
import { readTab, tabHash } from '@/lib/hashTab'
import { prefersDark, resolveTheme, watchSystemTheme, type Theme } from '@/lib/theme'
import { selectActivePad, selectLanding, useStore } from './store'

// ponytail: one applyLayout per raw frame even with several subscribers
const shaped = new WeakMap<Frame, Frame>()

/** Hot path: called every animation frame with the active pad's frame (layout applied). Keep cb cheap. */
export function useFrame(cb: (frame: Frame) => void): void {
  const active = useStore((s) => s.activeIndex)
  const layout = useStore((s) => s.layout)
  const ref = useRef(cb)
  useEffect(() => { ref.current = cb })
  useEffect(() => {
    if (active === null) return
    return onFrames((frames) => {
      const f = frames.find((x) => x.index === active)
      if (!f) return
      let out = shaped.get(f)
      if (!out) {
        out = applyLayout(f, layout)
        shaped.set(f, out)
      }
      ref.current(out)
    })
  }, [active, layout])
}

export const useHidOutput = () => useStore((s) => s.hidOut)
export const useActivePad = () => useStore(selectActivePad)

/** Raw frame without layout applied (for the learn wizard and raw views). */
export function useRawFrame(cb: (frame: Frame) => void): void {
  const active = useStore((s) => s.activeIndex)
  const ref = useRef(cb)
  useEffect(() => { ref.current = cb })
  useEffect(() => {
    if (active === null) return
    return onFrames((frames) => {
      const f = frames.find((x) => x.index === active)
      if (f) ref.current(f)
    })
  }, [active])
}

/** Wire the poller's pad list into the store once, at the app root. */
export function usePadRegistry(): void {
  const setPads = useStore((s) => s.setPads)
  useEffect(() => onPads(setPads), [setPads])
}

/** Hot path for WebHID state. */
export function useHidState(cb: (s: HidState) => void): void {
  const hid = useStore((s) => s.hid)
  const ref = useRef(cb)
  useEffect(() => { ref.current = cb })
  useEffect(() => hid?.subscribe((s) => ref.current(s)), [hid])
}

/** Low-frequency sampled value from a hot-path callback, for text readouts. Default 10 Hz. */
export function useSampled<T>(read: () => T, hz = 10): T {
  const [v, setV] = useState(read)
  const ref = useRef(read)
  useEffect(() => { ref.current = read })
  useEffect(() => {
    const id = setInterval(() => setV(ref.current()), 1000 / hz)
    return () => clearInterval(id)
  }, [hz])
  return v
}

/** Concrete theme: the persisted setting, with 'system' following the OS live. */
export function useResolvedTheme(): Theme {
  const setting = useStore((s) => s.settings.theme)
  const dark = useSyncExternalStore(watchSystemTheme, prefersDark, () => false)
  return resolveTheme(setting, dark)
}

/** Tab state mirrored into the URL hash (`#pro`), so deep links and back/forward work without a router. */
export function useHashTab<T extends string>(ids: readonly T[], fallback: T): [T, (t: T) => void] {
  const [tab, setTab] = useState<T>(() => readTab(location.hash, ids, fallback))
  useEffect(() => {
    const on = () => setTab(readTab(location.hash, ids, fallback))
    addEventListener('hashchange', on)
    return () => removeEventListener('hashchange', on)
  }, [ids, fallback])
  const set = useCallback((t: T) => {
    setTab(t)
    history.replaceState(null, '', tabHash(t))
  }, [])
  return [tab, set]
}

/** Landing visibility with hysteresis: Bluetooth pads blip out for a frame on reconnect; don't flash the landing. */
export function useLandingVisible(): boolean {
  const want = useStore(selectLanding)
  const [shown, setShown] = useState(want)
  useEffect(() => {
    const id = setTimeout(() => setShown(want), want ? 400 : 0)
    return () => clearTimeout(id)
  }, [want])
  return shown
}

const log = () => useStore.getState().pushHidLog
// ponytail: module flag, not a ref — StrictMode double-mounts and landing→Pro remounts would otherwise re-add every granted device
let reopened = false
/** Re-open WebHID devices the user already granted, once per page load. */
export function useReopenGranted(): void {
  useEffect(() => {
    if (reopened || !webHidSupported()) return
    reopened = true
    void reopenGranted(log()).then((cs) => cs.forEach((c) => useStore.getState().addHid(c)))
  }, [])
}

/** WebHID pair flow shared by the landing and Pro Mode. `add` must be called from a user gesture. */
export function useAddDevice(): { busy: boolean; err: string; add: () => Promise<void> } {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const add = useCallback(async () => {
    setBusy(true)
    setErr('')
    try {
      const c = await requestController(log())
      if (c) useStore.getState().addHid(c)
      else setErr('No controller selected.')
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }, [])
  return { busy, err, add }
}
