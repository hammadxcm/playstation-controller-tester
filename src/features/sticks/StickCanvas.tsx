import { useEffect, useRef } from 'react'
import { onRaf } from '@/lib/motion'
import type { StickTrace } from './trace'

interface Colors {
  line: string
  accent: string
  ok: string
  muted: string
}

function readColors(el: Element): Colors {
  const cs = getComputedStyle(el)
  const v = (n: string) => cs.getPropertyValue(n).trim()
  return { line: v('--line'), accent: v('--accent'), ok: v('--ok'), muted: v('--fg-muted') }
}

/** Draws the stick trace on the shared frame loop; reads from the ref, never re-renders. Colours are cached per theme. */
export function StickCanvas({
  trace,
  deadzone,
  mode,
}: {
  trace: React.RefObject<StickTrace>
  deadzone: number
  mode: 'fade' | 'constant' | 'none'
}) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current!
    const ctx = c.getContext('2d')!
    let colors = readColors(c)
    const mo = new MutationObserver(() => {
      colors = readColors(c)
    })
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    const app = c.closest('.app')
    if (app) mo.observe(app, { attributes: true, attributeFilter: ['data-family'] })
    let halo: CanvasGradient | null = null
    let haloSize = 0
    const draw = () => {
      const size = Math.round(c.clientWidth * devicePixelRatio)
      if (!size) return
      if (c.width !== size) c.width = c.height = size
      const s = size / 2
      const r = s * 0.9
      const dpr = devicePixelRatio
      ctx.clearRect(0, 0, size, size)
      ctx.lineWidth = 1
      ctx.strokeStyle = colors.line
      ctx.beginPath()
      ctx.moveTo(s, 0)
      ctx.lineTo(s, size)
      ctx.moveTo(0, s)
      ctx.lineTo(size, s)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(s, s, r, 0, Math.PI * 2)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(s, s, r * 0.5, 0, Math.PI * 2)
      ctx.stroke()
      ctx.strokeStyle = colors.ok
      ctx.beginPath()
      ctx.arc(s, s, r * deadzone, 0, Math.PI * 2)
      ctx.stroke()
      const t = trace.current
      // coverage ring: each touched 5° bin lights up
      const bins = t.bins
      ctx.lineWidth = 3 * dpr
      ctx.strokeStyle = colors.accent
      ctx.globalAlpha = 0.55
      for (let i = 0; i < bins.length; i++) {
        if (!bins[i]) continue
        const a0 = (i / bins.length) * Math.PI * 2 - Math.PI
        ctx.beginPath()
        ctx.arc(s, s, r + 4 * dpr, a0, a0 + (Math.PI * 2) / bins.length + 0.01)
        ctx.stroke()
      }
      ctx.globalAlpha = 1
      const pts = t.points
      const strokePath = (alphaFn: (i: number) => number, width: number, alpha: number) => {
        ctx.lineWidth = width
        for (let i = 1; i < pts.length; i++) {
          ctx.globalAlpha = alpha * alphaFn(i)
          ctx.beginPath()
          ctx.moveTo(s + pts[i - 1]!.x * r, s + pts[i - 1]!.y * r)
          ctx.lineTo(s + pts[i]!.x * r, s + pts[i]!.y * r)
          ctx.stroke()
        }
        ctx.globalAlpha = 1
      }
      if (pts.length > 1 && mode !== 'none') {
        const fade = mode === 'fade' ? (i: number) => i / pts.length : () => 1
        ctx.strokeStyle = colors.accent
        ctx.lineCap = 'round'
        strokePath(fade, 6 * dpr, 0.12) // glow
        strokePath(fade, 1.5 * dpr, mode === 'fade' ? 1 : 0.7)
      }
      const mag = Math.hypot(t.cur.x, t.cur.y)
      const cx = s + t.cur.x * r
      const cy = s + t.cur.y * r
      if (haloSize !== dpr) {
        halo = ctx.createRadialGradient(0, 0, 0, 0, 0, 16 * dpr)
        halo.addColorStop(0, colors.accent)
        halo.addColorStop(1, 'transparent')
        haloSize = dpr
      }
      if (mag > deadzone && halo) {
        ctx.save()
        ctx.translate(cx, cy)
        ctx.globalAlpha = 0.35
        ctx.fillStyle = halo
        ctx.beginPath()
        ctx.arc(0, 0, 16 * dpr, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }
      ctx.fillStyle = mag > deadzone ? colors.accent : colors.muted
      ctx.beginPath()
      ctx.arc(cx, cy, 5 * dpr, 0, Math.PI * 2)
      ctx.fill()
    }
    const off = onRaf(draw)
    return () => {
      off()
      mo.disconnect()
    }
  }, [trace, deadzone, mode])
  return <canvas ref={ref} className="stick" />
}
