/** Transient effect bus: things that animate once and are not state. */
export interface RumbleFx {
  strong: number
  weak: number
  lt: number
  rt: number
  /** 0 = until 'stop' */
  durationMs: number
}
interface Events {
  rumble: RumbleFx
  stop: undefined
}
type Listener<K extends keyof Events> = (payload: Events[K]) => void
const listeners: { [K in keyof Events]: Set<Listener<K>> } = { rumble: new Set(), stop: new Set() }

export const fx = {
  on<K extends keyof Events>(k: K, cb: Listener<K>): () => void {
    listeners[k].add(cb)
    return () => {
      listeners[k].delete(cb)
    }
  },
  emit<K extends keyof Events>(k: K, payload: Events[K]): void {
    listeners[k].forEach((cb) => cb(payload))
  },
}
