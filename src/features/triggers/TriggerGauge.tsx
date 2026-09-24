import { useEffect, useRef } from 'react'
import { onRaf, smooth } from '@/lib/motion'

const TICKS = [0.25, 0.5, 0.75, 1]

/** Side-view trigger lever that rotates with pull, plus a gauge with ticks and a persistent max marker. */
export function TriggerGauge({ value, max }: { value: React.RefObject<number>; max: React.RefObject<number> }) {
  const lever = useRef<SVGGElement>(null)
  const fill = useRef<SVGRectElement>(null)
  const marker = useRef<SVGLineElement>(null)
  const ticks = useRef<(SVGLineElement | null)[]>([])
  const cur = useRef(0)
  useEffect(
    () =>
      onRaf(() => {
        const v = value.current
        const c = (cur.current = Math.abs(cur.current - v) < 0.002 ? v : smooth(cur.current, v, 0.35))
        lever.current?.setAttribute('transform', `rotate(${(c * 22).toFixed(2)} 20 30)`)
        fill.current?.setAttribute('height', String(120 * c))
        fill.current?.setAttribute('y', String(150 - 120 * c))
        marker.current?.setAttribute('y1', String(150 - 120 * max.current))
        marker.current?.setAttribute('y2', String(150 - 120 * max.current))
        TICKS.forEach((t, i) => ticks.current[i]?.setAttribute('data-lit', String(c >= t - 0.01)))
      }),
    [value, max],
  )
  return (
    <svg viewBox="0 0 160 160" className="gauge" aria-hidden>
      <g transform="translate(0 0)">
        <rect x="6" y="20" width="28" height="60" rx="8" className="g-body" />
        <g ref={lever}>
          <path d="M20,30 C46,32 62,54 66,86 L58,90 C54,62 40,44 20,42 Z" className="g-lever" />
        </g>
        <circle cx="20" cy="30" r="4" className="g-pivot" />
      </g>
      <rect x="100" y="30" width="22" height="120" rx="6" className="g-track" />
      <rect ref={fill} x="100" y="150" width="22" height="0" rx="6" className="g-fill" />
      {TICKS.map((t, i) => (
        <g key={t}>
          <line ref={(el) => { ticks.current[i] = el }} x1="126" x2="134" y1={150 - 120 * t} y2={150 - 120 * t} className="g-tick" data-lit="false" />
          <text x="138" y={150 - 120 * t + 3} className="g-label">{Math.round(t * 100)}</text>
        </g>
      ))}
      <line ref={marker} x1="96" x2="126" y1="150" y2="150" className="g-max" />
    </svg>
  )
}
