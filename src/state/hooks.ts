import { useEffect, useRef, useState } from 'react'
import { onFrames, onPads } from '@/core/gamepad/poller'
import { applyLayout } from '@/core/gamepad/mapping'
import type { Frame } from '@/core/gamepad/types'
import type { HidState } from '@/core/hid/controller'
import { useStore } from './store'

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
