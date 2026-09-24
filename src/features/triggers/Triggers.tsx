import { useRef } from 'react'
import { STD } from '@/core/gamepad/types'
import { resolutionBits } from '@/core/analysis'
import { Card, Metric } from '@/components/ui'
import { useFrame, useSampled } from '@/state/hooks'
import { TriggerGauge } from './TriggerGauge'
import './triggers.css'

interface T {
  value: number
  max: number
  min: number
  pressed: boolean
  seen: Set<number>
}
const init = (): T => ({ value: 0, max: 0, min: 1, pressed: false, seen: new Set() })

function TriggerPanel({ label, t }: { label: string; t: React.RefObject<T> }) {
  const m = useSampled(() => {
    const v = t.current
    return { ...v, bits: resolutionBits(v.seen).bits }
  }, 12)
  const value = useRef(0)
  const max = useRef(0)
  useFrame(() => {
    value.current = t.current.value
    max.current = t.current.max
  })
  return (
    <Card title={label}>
      <div className="row" style={{ alignItems: 'stretch', gap: 24 }}>
        <TriggerGauge value={value} max={max} />
        <div className="metrics" style={{ flex: 1, alignContent: 'center' }}>
          <Metric label="Value" value={m.value.toFixed(3)} large />
          <Metric
            label="Max seen"
            value={m.max.toFixed(3)}
            tone={m.max >= 0.99 ? 'good' : m.max > 0 ? 'ok' : undefined}
          />
          <Metric label="Min while pressed" value={m.min < 1 ? m.min.toFixed(3) : '–'} />
          <Metric label="Resolution" value={m.bits ? `${m.bits}-bit` : '–'} />
          <Metric
            label="Digital"
            value={m.pressed ? 'pressed' : 'released'}
            tone={m.pressed ? 'good' : undefined}
          />
        </div>
      </div>
      <p className="small muted">
        Pull slowly to the stop. A healthy trigger reads near 0 at rest and reaches 1.0 at full
        travel without jumps; the tick marks light as you pass them and the bar keeps your maximum.
      </p>
    </Card>
  )
}

export function Triggers() {
  const l = useRef(init())
  const r = useRef(init())
  useFrame((f) => {
    for (const [ref, idx] of [
      [l, STD.l2],
      [r, STD.r2],
    ] as const) {
      const b = f.buttons[idx]
      const t = ref.current
      t.value = b?.value ?? 0
      t.pressed = !!b?.pressed
      t.max = Math.max(t.max, t.value)
      if (t.value > 0) t.min = Math.min(t.min, t.value)
      if (t.seen.size < 5000) t.seen.add(t.value)
    }
  })
  return (
    <div className="grid-2">
      <TriggerPanel label="Left trigger (L2 / LT)" t={l} />
      <TriggerPanel label="Right trigger (R2 / RT)" t={r} />
    </div>
  )
}
