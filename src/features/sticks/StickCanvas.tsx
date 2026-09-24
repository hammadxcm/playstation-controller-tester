import { useEffect, useRef } from 'react'
import type { StickTrace } from './trace'

/** Draws the stick trace via requestAnimationFrame; reads from the ref, never re-renders. */
export function StickCanvas({ trace, deadzone, mode }: { trace: React.RefObject<StickTrace>; deadzone: number; mode: 'fade' | 'constant' | 'none' }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current!
    const ctx = c.getContext('2d')!
    let raf = 0
    const css = (v: string) => getComputedStyle(c).getPropertyValue(v).trim()
    const draw = () => {
      const size = c.clientWidth * devicePixelRatio
      if (c.width !== size) c.width = c.height = size
      const s = size / 2
      const r = s * 0.9
      ctx.clearRect(0, 0, size, size)
      ctx.strokeStyle = css('--line')
      ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(s, 0); ctx.lineTo(s, size); ctx.moveTo(0, s); ctx.lineTo(size, s); ctx.stroke()
      ctx.beginPath(); ctx.arc(s, s, r, 0, Math.PI * 2); ctx.stroke()
      ctx.beginPath(); ctx.arc(s, s, r * 0.5, 0, Math.PI * 2); ctx.stroke()
      ctx.strokeStyle = css('--ok')
      ctx.beginPath(); ctx.arc(s, s, r * deadzone, 0, Math.PI * 2); ctx.stroke()
      const t = trace.current
      const pts = t.points
      ctx.lineWidth = 1.5 * devicePixelRatio
      ctx.strokeStyle = css('--accent')
      if (mode === 'fade') {
        for (let i = 1; i < pts.length; i++) {
          ctx.globalAlpha = i / pts.length
          ctx.beginPath()
          ctx.moveTo(s + pts[i - 1]!.x * r, s + pts[i - 1]!.y * r)
          ctx.lineTo(s + pts[i]!.x * r, s + pts[i]!.y * r)
          ctx.stroke()
        }
        ctx.globalAlpha = 1
      } else if (mode === 'constant' && pts.length > 1) {
        ctx.globalAlpha = 0.7
        ctx.beginPath()
        ctx.moveTo(s + pts[0]!.x * r, s + pts[0]!.y * r)
        for (let i = 1; i < pts.length; i++) ctx.lineTo(s + pts[i]!.x * r, s + pts[i]!.y * r)
        ctx.stroke()
        ctx.globalAlpha = 1
      }
      const mag = Math.hypot(t.cur.x, t.cur.y)
      ctx.fillStyle = mag > deadzone ? css('--accent') : css('--fg-muted')
      ctx.beginPath(); ctx.arc(s + t.cur.x * r, s + t.cur.y * r, 5 * devicePixelRatio, 0, Math.PI * 2); ctx.fill()
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [trace, deadzone, mode])
  return <canvas ref={ref} className="stick" />
}
