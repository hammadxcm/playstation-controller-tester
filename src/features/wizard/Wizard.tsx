import { useEffect, useRef, useState } from 'react'
import { score } from '@/core/analysis'
import { Badge, Button, Card, ProgressRing, type ProgressRingHandle } from '@/components/ui'
import { reducedMotion } from '@/lib/motion'
import { useFrame } from '@/state/hooks'
import { useStore } from '@/state/store'
import { useActivePad } from '@/state/hooks'
import { buildSteps, DEFAULT_METRICS, type Row, type WizardStep } from './steps'

type Phase = 'idle' | 'running' | 'done'

export function Wizard() {
  const pad = useActivePad()
  const setReport = useStore((s) => s.setReport)
  const report = useStore((s) => s.report)
  const [steps, setSteps] = useState<WizardStep[]>([])
  const [phase, setPhase] = useState<Phase>('idle')
  const [i, setI] = useState(0)
  const [rows, setRows] = useState<Row[]>([])
  const [startedAt, setStartedAt] = useState(0)
  const metrics = useRef({ ...DEFAULT_METRICS })
  const step = steps[i]

  const ring = useRef<ProgressRingHandle>(null)
  const scoreEl = useRef<HTMLSpanElement>(null)
  useFrame((f) => { if (phase === 'running') step?.feed(f) })

  const start = () => {
    setSteps(buildSteps())
    metrics.current = { ...DEFAULT_METRICS }
    setRows([])
    setI(0)
    setStartedAt(performance.now())
    setPhase('running')
  }
  const advance = (skip = false) => {
    if (!step) return
    let next: Row[]
    if (!skip) {
      const out = step.finish()
      next = [...rows, ...out.rows]
      Object.assign(metrics.current, out.metrics)
    } else {
      next = [...rows, { label: step.title, value: 'skipped' }]
    }
    setRows(next)
    if (i + 1 >= steps.length) {
      const sc = score(metrics.current)
      setReport({ at: new Date().toISOString(), padId: pad?.id ?? '', score: sc, metrics: Object.fromEntries(next.map((r) => [r.label, r.value])) })
      setPhase('done')
    } else {
      setI(i + 1)
      setStartedAt(performance.now())
      ring.current?.set(0)
    }
  }
  const advanceRef = useRef(advance)
  useEffect(() => { advanceRef.current = advance })
  useEffect(() => {
    if (phase !== 'running' || !step) return
    const id = setInterval(() => {
      const p = Math.max(step.progress(), (performance.now() - startedAt) / step.maxMs)
      ring.current?.set(p)
      if (p >= 1) advanceRef.current()
    }, 100)
    return () => clearInterval(id)
  }, [phase, step, startedAt])
  // Count the score up once the run finishes.
  useEffect(() => {
    if (phase !== 'done' || !report || !scoreEl.current) return
    const el = scoreEl.current
    const target = report.score.score
    if (reducedMotion()) { el.textContent = String(target); return }
    const t0 = performance.now()
    let raf = 0
    const tick = () => {
      const p = Math.min(1, (performance.now() - t0) / 900)
      el.textContent = String(Math.round(target * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [phase, report])

  if (!pad) return null
  return (
    <div className="grid-2">
      <Card title="Health check">
        {phase === 'idle' && (
          <>
            <p className="muted">Six guided steps, about two minutes: drift, circularity for both sticks, resolution, report rate and a button sweep. The result is a 0–100 score you can export from the Report tab.</p>
            <div><Button primary onClick={start}>Start</Button></div>
          </>
        )}
        {phase === 'running' && step && (
          <div key={step.id} className="stack enter">
            <div className="row" style={{ gap: 14 }}>
              <ProgressRing ref={ring} size={56} stroke={6}><span className="small mono">{i + 1}/{steps.length}</span></ProgressRing>
              <div className="stack" style={{ gap: 2 }}><Badge tone="accent">Step {i + 1} of {steps.length}</Badge><h2>{step.title}</h2></div>
            </div>
            <p>{step.instructions}</p>
            <div className="row">
              <Button onClick={() => advance()}>Done, next</Button>
              <Button small onClick={() => advance(true)}>Skip</Button>
              <span className="dim small">auto-advances at {Math.round(step.maxMs / 1000)} s</span>
            </div>
          </div>
        )}
        {phase === 'done' && report && (
          <>
            <div className="row" style={{ alignItems: 'baseline', gap: 16 }}>
              <span ref={scoreEl} className="score" style={{ color: `var(--${report.score.grade === 'A' || report.score.grade === 'B' ? 'good' : report.score.grade === 'C' ? 'ok' : 'bad'})` }}>0</span>
              <span className="score dim pop">{report.score.grade}</span>
            </div>
            <div className="row"><Button primary onClick={start}>Run again</Button></div>
          </>
        )}
      </Card>
      <Card title="Results">
        {rows.length === 0 ? <p className="muted">Results appear here as each step completes.</p> : (
          <table className="table">
            <tbody>
              {rows.map((r, k) => (
                <tr key={k} className="enter" style={{ ['--i' as string]: k % 6 }}><td>{r.label}</td><td className="mono">{r.value}</td><td>{r.tone && <Badge tone={r.tone}>{r.tone}</Badge>}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}
