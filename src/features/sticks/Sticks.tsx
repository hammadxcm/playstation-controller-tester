import { useEffect, useRef, useState } from 'react'
import { circularity, deadzone as dz, drift, resolutionBits, type Point } from '@/core/analysis'
import { Badge, Button, Card, Metric, Slider } from '@/components/ui'
import { useFrame, useSampled } from '@/state/hooks'
import { useStore } from '@/state/store'
import { StickCanvas } from './StickCanvas'
import { newTrace, pushTrace, resetTrace, type StickTrace } from './trace'
import { animate } from '@/lib/motion'

const CAP = 20000

class Buf {
  trace: StickTrace = newTrace()
  all: Point[] = []
  rest: Point[] = []
  feed(x: number, y: number, mode: 'fade' | 'constant' | 'none') {
    pushTrace(this.trace, x, y, mode)
    if (this.all.length < CAP) this.all.push({ x, y })
    if (Math.hypot(x, y) < 0.2) {
      this.rest.push({ x, y })
      if (this.rest.length > 300) this.rest.shift()
    }
  }
  reset() {
    this.all = []
    this.rest = []
    resetTrace(this.trace)
  }
}

function StickPanel({ label, buf }: { label: string; buf: React.RefObject<Buf> }) {
  const { deadzone, trace } = useStore((s) => s.settings)
  const setSettings = useStore((s) => s.setSettings)
  const traceRef = useRef(buf.current.trace)
  const panel = useRef<HTMLDivElement>(null)
  const m = useSampled(() => {
    const b = buf.current
    const d = drift(b.rest)
    const c = circularity(b.all)
    const r = resolutionBits(b.all.flatMap((p) => [p.x, p.y]))
    const z = dz(b.all)
    return { d, c, r, z, cur: b.trace.cur, n: b.all.length, filled: b.trace.filled }
  }, 8)
  const complete = m.filled >= 70
  const wasComplete = useRef(false)
  useEffect(() => {
    if (complete && !wasComplete.current) {
      const c = panel.current?.querySelector('canvas')
      if (c) animate(c, [{ boxShadow: '0 0 0 0 var(--accent)' }, { boxShadow: '0 0 0 14px transparent' }], { duration: 700, easing: 'cubic-bezier(.16,1,.3,1)' })
    }
    wasComplete.current = complete
  }, [complete])
  const reset = () => buf.current.reset()
  const faults = [
    m.c.incompleteRange && ['Incomplete range', 'bad'],
    m.z.centerSkip > 0.15 && ['Center skipping', 'bad'],
    m.r.bits > 0 && m.r.bits < 8 && ['Low resolution', 'ok'],
    m.z.inner > 0.12 && ['Inner deadzone', 'ok'],
    m.z.axisSnapping && ['Axis snapping', 'ok'],
  ].filter(Boolean) as [string, 'ok' | 'bad'][]
  return (
    <Card title={label} right={<Button small onClick={reset}>Reset</Button>}>
      <div ref={panel}><StickCanvas trace={traceRef} deadzone={deadzone} mode={trace} /></div>
      <div className="row small mono muted" style={{ justifyContent: 'center' }}>
        <span>x {m.cur.x.toFixed(4)}</span>
        <span>y {m.cur.y.toFixed(4)}</span>
        <span>r {Math.hypot(m.cur.x, m.cur.y).toFixed(4)}</span>
      </div>
      <div className="metrics">
        <Metric label="Drift" value={m.d.magnitude.toFixed(3)} tone={m.d.verdict} />
        <Metric label="Circularity err" value={m.c.coverage > 0.5 ? `${m.c.errorPct.toFixed(1)} %` : '–'} tone={m.c.coverage > 0.5 ? m.c.verdict : undefined} />
        <Metric label="Coverage" value={`${Math.round(m.c.coverage * 100)} %`} />
        <Metric label="Resolution" value={m.r.bits ? `${m.r.bits}-bit` : '–'} />
        <Metric label="Inner DZ" value={m.z.inner ? m.z.inner.toFixed(3) : '–'} />
      </div>
      <div className="row">
        {faults.length ? faults.map(([f, tone]) => <span key={f} className="pop"><Badge tone={tone}>{f}</Badge></span>) : <Badge tone="good">No faults detected</Badge>}
        <span className="dim small">{m.n} samples</span>
      </div>
      <details className="small muted">
        <summary>How to test</summary>
        <p>Drift: let go of the stick and watch the offset. Circularity: roll the stick slowly around its outer edge two or three times; below 10 % is excellent. Resolution: move the stick slowly; 8-bit is typical, 12-bit is Edge/Elite class.</p>
      </details>
      <Slider label="Deadzone ring" value={deadzone} max={0.3} step={0.01} onChange={(v) => setSettings({ deadzone: v })} format={(v) => `${Math.round(v * 100)} %`} />
    </Card>
  )
}

export function Sticks() {
  const left = useRef(new Buf())
  const right = useRef(new Buf())
  const traceMode = useStore((s) => s.settings.trace)
  const setSettings = useStore((s) => s.setSettings)
  const [, force] = useState(0)
  useFrame((f) => {
    left.current.feed(f.axes[0] ?? 0, f.axes[1] ?? 0, traceMode)
    right.current.feed(f.axes[2] ?? 0, f.axes[3] ?? 0, traceMode)
  })
  return (
    <div className="stack">
      <div className="row">
        <span className="muted small">Trace</span>
        {(['fade', 'constant', 'none'] as const).map((m) => (
          <Button key={m} small primary={traceMode === m} onClick={() => { setSettings({ trace: m }); force((n) => n + 1) }}>{m}</Button>
        ))}
      </div>
      <div className="grid-2">
        <StickPanel label="Left stick" buf={left} />
        <StickPanel label="Right stick" buf={right} />
      </div>
    </div>
  )
}
