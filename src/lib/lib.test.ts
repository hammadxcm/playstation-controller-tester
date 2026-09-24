// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.resetModules()
  vi.unstubAllGlobals()
  history.replaceState(null, '', '/')
})

describe('motion', () => {
  it('honours the ?motion=reduce override and skips animations', async () => {
    history.replaceState(null, '', '/?motion=reduce')
    const m = await import('./motion')
    expect(m.reducedMotion()).toBe(true)
    expect(document.documentElement.dataset.motion).toBe('reduce')
    expect(m.animate(document.body, [], { duration: 1 })).toBeNull()
    expect(m.smooth(0, 1, 0.5)).toBe(1)
  })
  it('follows the media query and animates otherwise', async () => {
    let listener: ((e: { matches: boolean }) => void) | null = null
    vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener: (_: string, cb: (e: { matches: boolean }) => void) => { listener = cb } }))
    const m = await import('./motion')
    expect(m.reducedMotion()).toBe(false)
    expect(m.smooth(0, 1, 0.5)).toBe(0.5)
    const el = document.createElement('div')
    el.animate = vi.fn(() => ({}) as Animation)
    expect(m.animate(el, [], { duration: 1 })).not.toBeNull()
    listener!({ matches: true })
    expect(m.reducedMotion()).toBe(true)
    expect(document.documentElement.dataset.motion).toBe('reduce')
  })
  it('media changes are ignored when the URL pins motion', async () => {
    history.replaceState(null, '', '/?motion=full')
    let listener: ((e: { matches: boolean }) => void) | null = null
    vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener: (_: string, cb: (e: { matches: boolean }) => void) => { listener = cb } }))
    const m = await import('./motion')
    expect(m.reducedMotion()).toBe(false)
    listener!({ matches: true })
    expect(m.reducedMotion()).toBe(false)
  })
  it('runs one shared frame loop and collects perf stats', async () => {
    const rafs: FrameRequestCallback[] = []
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { rafs.push(cb); return rafs.length })
    const m = await import('./motion')
    const calls: number[] = []
    const off = m.onRaf((t) => calls.push(t))
    const off2 = m.onRaf(() => undefined)
    rafs.shift()!(1)
    expect(calls).toEqual([1])
    off()
    off2()
    rafs.shift()!(2)
    expect(calls).toEqual([1])
    expect(rafs.length).toBe(0)
    m.perf.sample('a', 1)
    for (let i = 0; i < 700; i++) m.perf.sample('a', i)
    m.perf.count('w')
    m.perf.count('w', 2)
    const s = m.perf.stats() as { a: { n: number; p95: number }; w: number }
    expect(s.a.n).toBe(600)
    expect(s.w).toBe(3)
    m.perf.reset()
    expect(m.perf.stats()).toEqual({})
  })
})

describe('viewTransition', () => {
  it('falls back to a plain update without startViewTransition and under reduced motion', async () => {
    const { transition } = await import('./viewTransition')
    const fn = vi.fn()
    await transition(fn)
    expect(fn).toHaveBeenCalled()
    history.replaceState(null, '', '/?motion=reduce')
    vi.resetModules()
    const vt = await import('./viewTransition')
    ;(document as unknown as { startViewTransition: unknown }).startViewTransition = vi.fn()
    const fn2 = vi.fn()
    await vt.transition(fn2, 'back')
    expect(fn2).toHaveBeenCalled()
    expect((document as unknown as { startViewTransition: ReturnType<typeof vi.fn> }).startViewTransition).not.toHaveBeenCalled()
    delete (document as unknown as { startViewTransition?: unknown }).startViewTransition
  })
  it('uses startViewTransition when available and swallows its rejection', async () => {
    const svt = vi.fn((cb: () => void) => { cb(); return { finished: Promise.reject(new Error('skipped')) } })
    ;(document as unknown as { startViewTransition: unknown }).startViewTransition = svt
    const { transition } = await import('./viewTransition')
    const fn = vi.fn()
    await transition(fn, 'back')
    expect(svt).toHaveBeenCalled()
    expect(fn).toHaveBeenCalled()
    expect(document.documentElement.dataset.dir).toBe('back')
    delete (document as unknown as { startViewTransition?: unknown }).startViewTransition
  })
})
