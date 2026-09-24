import { useEffect, useRef } from 'react'
import { PROFILES } from '@/core/gamepad/profiles'
import type { Family } from '@/core/gamepad/identify'
import { STD, type Frame, type StdButton } from '@/core/gamepad/types'
import { useFrame } from '@/state/hooks'
import { LAYOUTS } from './layouts'

const STICK_TRAVEL = 11

/** Parametric controller drawing. Highlights are applied straight to the DOM on every frame. */
export function Silhouette({ family }: { family: Family }) {
  const L = LAYOUTS[family]
  const labels = PROFILES[family].buttons
  const svg = useRef<SVGSVGElement>(null)
  const nodes = useRef<Map<string, Element>>(new Map())

  useEffect(() => {
    const m = new Map<string, Element>()
    svg.current?.querySelectorAll('[data-btn],[data-axis]').forEach((el) => m.set(el.getAttribute('data-btn') ?? el.getAttribute('data-axis')!, el))
    nodes.current = m
  }, [family])

  useFrame((f: Frame) => {
    const m = nodes.current
    for (const name of Object.keys(STD) as StdButton[]) {
      const b = f.buttons[STD[name]]
      const el = m.get(name)
      if (!el) continue
      el.setAttribute('data-on', String(!!b?.pressed))
      if (name === 'l2' || name === 'r2') (m.get(`${name}-analog`) as SVGElement | undefined)?.style.setProperty('opacity', String(b?.value ?? 0))
    }
    const ls = m.get('ls') as SVGElement | undefined
    const rs = m.get('rs') as SVGElement | undefined
    ls?.setAttribute('transform', `translate(${(f.axes[0] ?? 0) * STICK_TRAVEL} ${(f.axes[1] ?? 0) * STICK_TRAVEL})`)
    rs?.setAttribute('transform', `translate(${(f.axes[2] ?? 0) * STICK_TRAVEL} ${(f.axes[3] ?? 0) * STICK_TRAVEL})`)
  })

  const face = (name: StdButton, dx: number, dy: number) => (
    <g key={name}>
      <circle data-btn={name} cx={L.face[0] + dx} cy={L.face[1] + dy} r={11} />
      <text className="label" x={L.face[0] + dx} y={L.face[1] + dy}>{labels[name]}</text>
    </g>
  )
  const dpad = (name: StdButton, dx: number, dy: number) => (
    <rect key={name} data-btn={name} x={L.dpad[0] + dx - 8} y={L.dpad[1] + dy - 8} width={16} height={16} rx={3} />
  )
  const stick = (key: 'ls' | 'rs', click: StdButton, [x, y]: [number, number]) => (
    <g key={key}>
      <circle className="stick-well" cx={x} cy={y} r={24} />
      <g data-axis={key}>
        <circle data-btn={click} cx={x} cy={y} r={16} />
        <text className="label" x={x} y={y}>{labels[click]}</text>
      </g>
    </g>
  )
  const shoulder = (name: StdButton, [x, y, w, h]: [number, number, number, number], analog: boolean) => (
    <g key={name}>
      <rect data-btn={name} x={x} y={y} width={w} height={h} rx={5} />
      {analog && <rect className="analog" data-axis={`${name}-analog`} x={x} y={y} width={w} height={h} rx={5} />}
      <text className="label" x={x + w / 2} y={y + h / 2}>{labels[name]}</text>
    </g>
  )

  return (
    <svg ref={svg} className="silhouette" viewBox="0 0 400 250" role="img" aria-label={`${PROFILES[family].label} controller`}>
      {shoulder('l2', L.l2, true)}
      {shoulder('r2', L.r2, true)}
      {shoulder('l1', L.l1, false)}
      {shoulder('r1', L.r1, false)}
      <path className="body" d={L.body} />
      {L.touchpad && (
        <g>
          <rect data-btn="touchpad" x={L.touchpad[0]} y={L.touchpad[1]} width={L.touchpad[2]} height={L.touchpad[3]} rx={8} />
          <text className="label" x={L.touchpad[0] + L.touchpad[2] / 2} y={L.touchpad[1] + L.touchpad[3] / 2}>{labels.touchpad}</text>
        </g>
      )}
      {dpad('up', 0, -17)}
      {dpad('down', 0, 17)}
      {dpad('left', -17, 0)}
      {dpad('right', 17, 0)}
      {face('north', 0, -21)}
      {face('south', 0, 21)}
      {face('west', -21, 0)}
      {face('east', 21, 0)}
      {stick('ls', 'l3', L.ls)}
      {stick('rs', 'r3', L.rs)}
      <rect data-btn="select" x={L.select[0] - 7} y={L.select[1] - 9} width={14} height={18} rx={4} />
      <rect data-btn="start" x={L.start[0] - 7} y={L.start[1] - 9} width={14} height={18} rx={4} />
      <circle data-btn="home" cx={L.home[0]} cy={L.home[1]} r={10} />
      {L.aux && !L.touchpad && <circle data-btn="touchpad" cx={L.aux[0]} cy={L.aux[1]} r={7} />}
      {L.aux && L.touchpad && <circle cx={L.aux[0]} cy={L.aux[1]} r={6} className="stick-well" />}
    </svg>
  )
}
