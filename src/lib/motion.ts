/** Single source of truth for motion preference, shared rAF loop, tiny perf collector. DOM-only module. */
const params = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams()
const mq = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null
let reduce = params.get('motion') === 'reduce' || (params.get('motion') !== 'full' && !!mq?.matches)

function applyMotion() {
  if (typeof document !== 'undefined') document.documentElement.dataset.motion = reduce ? 'reduce' : 'full'
}
applyMotion()
mq?.addEventListener('change', (e) => {
  if (params.has('motion')) return
  reduce = e.matches
  applyMotion()
})

export const reducedMotion = (): boolean => reduce

/** el.animate that respects reduced motion (returns null instead of animating). */
export function animate(el: Element, keyframes: Keyframe[] | PropertyIndexedKeyframes, options: KeyframeAnimationOptions): Animation | null {
  if (reduce) return null
  return el.animate(keyframes, options)
}

/** Exponential smoothing step. k=1 means no smoothing. */
export const smooth = (cur: number, target: number, k: number): number => (reduce ? target : cur + (target - cur) * k)

const rafCbs = new Set<(t: number) => void>()
let raf = 0
function loop(t: number) {
  rafCbs.forEach((cb) => cb(t))
  raf = rafCbs.size ? requestAnimationFrame(loop) : 0
}
/** One shared animation-frame loop for every canvas/model. */
export function onRaf(cb: (t: number) => void): () => void {
  rafCbs.add(cb)
  if (!raf) raf = requestAnimationFrame(loop)
  return () => {
    rafCbs.delete(cb)
  }
}

// ponytail: perf collector is a plain ring per name; enough for __ct.stats() in headless checks
const samples = new Map<string, number[]>()
const counters = new Map<string, number>()
export const perf = {
  sample(name: string, ms: number) {
    const arr = samples.get(name) ?? []
    arr.push(ms)
    if (arr.length > 600) arr.shift()
    samples.set(name, arr)
  },
  count(name: string, n = 1) {
    counters.set(name, (counters.get(name) ?? 0) + n)
  },
  stats() {
    const out: Record<string, unknown> = Object.fromEntries(counters)
    for (const [name, arr] of samples) {
      const s = [...arr].sort((a, b) => a - b)
      out[name] = { n: s.length, p50: s[Math.floor(s.length * 0.5)] ?? 0, p95: s[Math.floor(s.length * 0.95)] ?? 0 }
    }
    return out
  },
  reset() {
    samples.clear()
    counters.clear()
  },
}
