import { useEffect, useRef, type RefObject } from 'react'
import { animate, onRaf, perf, reducedMotion, smooth } from '@/lib/motion'
import { fx } from '@/state/fx'
import { useFrame, useHidOutput } from '@/state/hooks'
import type { ControllerGeometry } from './geometry'
import { createRig } from './rig'

const TRAVEL = 11
const SHAKE = [[1, 0], [-1, 0.6], [0.4, -1], [-0.7, -0.3], [1, 0.5], [-0.5, 1], [0, -0.8], [0.8, 0.3], [-1, -0.5], [0.3, 1], [-0.4, -0.6], [0, 0]]

function shakeFrames(amp: number, rot: number): Keyframe[] {
  return SHAKE.map(([x, y]) => ({ transform: `translate(${(x! * amp).toFixed(2)}px, ${(y! * amp).toFixed(2)}px) rotate(${(x! * rot).toFixed(2)}deg)` }))
}

/** Binds the pure rig to the DOM: frame diffs → attribute/var writes, hidOut → lightbar/LEDs, fx → shake. */
export function useControllerRig(wrapper: RefObject<HTMLDivElement | null>, parts: RefObject<SVGSVGElement | null>, g: ControllerGeometry) {
  const nodes = useRef(new Map<string, Element>())
  const target = useRef({ l2: 0, r2: 0, lsx: 0, lsy: 0, rsx: 0, rsy: 0 })
  const cur = useRef({ l2: -1, r2: -1, lsx: 0, lsy: 0, rsx: 0, rsy: 0 })
  const rig = useRef(createRig())
  const hidOut = useHidOutput()

  useEffect(() => {
    const m = new Map<string, Element>()
    parts.current?.querySelectorAll('[data-part]').forEach((el) => m.set(el.getAttribute('data-part')!, el))
    for (const s of ['ls', 'rs']) {
      const p = m.get(s)
      p?.querySelectorAll('[data-sub]').forEach((el) => m.set(`${s}:${el.getAttribute('data-sub')}`, el))
    }
    parts.current?.querySelectorAll('.m-heat').forEach((el) => m.set(`heat:${el.getAttribute('data-heat')}`, el))
    parts.current?.querySelectorAll('.m-led').forEach((el) => m.set(`led:${el.getAttribute('data-led')}`, el))
    const mic = parts.current?.querySelector('.m-mic')
    if (mic) m.set('mic', mic)
    const lb = parts.current?.querySelector('.m-lightbar')
    if (lb) m.set('lightbar', lb)
    nodes.current = m
    rig.current = createRig()
    cur.current = { l2: -1, r2: -1, lsx: 0, lsy: 0, rsx: 0, rsy: 0 }
  }, [g, parts])

  useFrame((f) => {
    const t0 = performance.now()
    const writes = rig.current.diff(f)
    const m = nodes.current
    for (const w of writes) {
      if (w.kind === 'on') m.get(w.part)?.setAttribute('data-on', String(w.on))
      else if (w.kind === 'edge') {
        const r = m.get(w.part)?.querySelector('.m-ripple')
        if (r) animate(r, [{ transform: 'scale(1)', opacity: 0.55 }, { transform: 'scale(2.4)', opacity: 0 }], { duration: 320, easing: 'cubic-bezier(.16,1,.3,1)' })
      } else if (w.kind === 'var') target.current[w.part] = w.value
      else {
        target.current[`${w.part}x`] = w.x
        target.current[`${w.part}y`] = w.y
      }
    }
    if (writes.length) {
      perf.count('writes', writes.length)
      perf.sample('rig', performance.now() - t0)
    }
  })

  useEffect(
    () =>
      onRaf(() => {
        const m = nodes.current
        const t = target.current
        const c = cur.current
        const k = 0.5
        for (const p of ['l2', 'r2'] as const) {
          if (Math.abs(c[p] - t[p]) > 0.0015) {
            c[p] = Math.abs(c[p] - t[p]) < 0.004 ? t[p] : smooth(c[p], t[p], k)
            ;(m.get(p) as HTMLElement | undefined)?.style.setProperty('--v', c[p].toFixed(3))
          }
        }
        for (const s of ['ls', 'rs'] as const) {
          const tx = t[`${s}x`]
          const ty = t[`${s}y`]
          if (Math.abs(c[`${s}x`] - tx) > 0.0015 || Math.abs(c[`${s}y`] - ty) > 0.0015) {
            const x = (c[`${s}x`] = smooth(c[`${s}x`], tx, k))
            const y = (c[`${s}y`] = smooth(c[`${s}y`], ty, k))
            const mag = Math.hypot(x, y)
            const cap = m.get(`${s}:cap`) as HTMLElement | undefined
            const sh = m.get(`${s}:shadow`) as HTMLElement | undefined
            const hi = m.get(`${s}:hi`) as HTMLElement | undefined
            cap?.style.setProperty('transform', `translate(${(x * TRAVEL).toFixed(2)}px, ${(y * TRAVEL).toFixed(2)}px) scale(${(1 - 0.07 * mag).toFixed(3)})`)
            sh?.style.setProperty('transform', `translate(${(x * TRAVEL * 0.45).toFixed(2)}px, ${(y * TRAVEL * 0.45).toFixed(2)}px)`)
            hi?.style.setProperty('transform', `translate(${(x * TRAVEL * 1.35).toFixed(2)}px, ${(y * TRAVEL * 1.35).toFixed(2)}px)`)
          }
        }
      }),
    [],
  )

  // Low-frequency: what Pro Mode told the pad → lightbar, LEDs, mic, trigger effect marker
  const flashAnim = useRef<Animation[]>([])
  useEffect(() => {
    const m = nodes.current
    const lb = m.get('lightbar') as HTMLElement | undefined
    if (lb) {
      const rgb = hidOut.lightbar
      lb.style.setProperty('--lb', rgb ? rgb.join(' ') : '0 0 0')
      lb.style.setProperty('--lb-a', rgb && rgb.some(Boolean) ? '1' : '0')
      flashAnim.current.forEach((a) => a.cancel())
      flashAnim.current = []
      if (hidOut.flash && rgb) {
        const { onMs, offMs } = hidOut.flash
        const total = onMs + offMs || 1
        lb.querySelectorAll('.m-lb, .m-lb-glow').forEach((el) => {
          const a = animate(el, [{ opacity: 1, offset: 0 }, { opacity: 1, offset: onMs / total }, { opacity: 0, offset: onMs / total }, { opacity: 0, offset: 1 }], { duration: total, iterations: Infinity })
          if (a) flashAnim.current.push(a)
        })
      }
    }
    for (let i = 0; i < 5; i++) {
      const led = m.get(`led:${i}`) as HTMLElement | undefined
      if (!led) continue
      led.setAttribute('data-on', String(!!(hidOut.playerLeds.mask & (1 << i))))
      led.style.setProperty('--led-b', String([1, 0.6, 0.3][hidOut.playerLeds.brightness]))
    }
    m.get('mic')?.setAttribute('data-mode', hidOut.micLed)
    for (const side of ['left', 'right'] as const) m.get(side === 'left' ? 'l2' : 'r2')?.setAttribute('data-fx', hidOut.trigger[side] !== 0x05 ? 'on' : 'off')
  }, [hidOut])

  // Transient: rumble → shake wrapper, heat grips, Xbox impulse rings
  useEffect(() => {
    let anims: Animation[] = []
    let timer = 0
    const heat = (l: number, r: number, lt: number, rt: number) => {
      const m = nodes.current
      ;(m.get('heat:l') as HTMLElement | undefined)?.style.setProperty('opacity', String(l * 0.9))
      ;(m.get('heat:r') as HTMLElement | undefined)?.style.setProperty('opacity', String(r * 0.9))
      for (const [p, v] of [['l2', lt], ['r2', rt]] as const) {
        const ring = m.get(p)?.querySelector('.m-impulse') as HTMLElement | null | undefined
        ring?.style.setProperty('opacity', String(v))
      }
    }
    const stop = () => {
      anims.forEach((a) => a.cancel())
      anims = []
      clearTimeout(timer)
      heat(0, 0, 0, 0)
      wrapper.current?.style.removeProperty('will-change')
    }
    const offR = fx.on('rumble', (r) => {
      stop()
      heat(r.strong, r.weak, r.lt, r.rt)
      const el = wrapper.current
      if (el && !reducedMotion()) {
        el.style.willChange = 'transform'
        const iter = (cycle: number) => (r.durationMs ? Math.max(1, Math.round(r.durationMs / cycle)) : Infinity)
        if (r.strong) anims.push(el.animate(shakeFrames(2.4 * r.strong, 0.4 * r.strong), { duration: 80, iterations: iter(80), composite: 'add' }))
        if (r.weak) anims.push(el.animate(shakeFrames(1 * r.weak, 0.1 * r.weak), { duration: 34, iterations: iter(34), composite: 'add' }))
      }
      if (r.durationMs) timer = window.setTimeout(stop, r.durationMs)
    })
    const offS = fx.on('stop', stop)
    return () => {
      offR()
      offS()
      stop()
    }
  }, [wrapper])
}
