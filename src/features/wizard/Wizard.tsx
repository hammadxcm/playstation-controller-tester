import { useEffect, useRef, useState } from 'react'
import { score } from '@/core/analysis'
import { Badge, Button, Card } from '@/components/ui'
import { useFrame, useSampled } from '@/state/hooks'
import { useActivePad, useStore } from '@/state/store'
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

  useFrame((f) => { if (phase === 'running') step?.feed(f) })
  const progress = useSampled(() => (phase === 'running' && step ? step.progress() : 0), 10)
  const elapsed = useSampled(() => (phase === 'running' ? performance.now() - startedAt : 0), 4)

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
    if (!skip) {
      const out = step.finish()
      setRows((r) => [...r, ...out.rows])
      Object.assign(metrics.current, out.metrics)
    } else {
      setRows((r) => [...r, { label: step.title, value: 'skipped' }])
    }
    if (i + 1 >= steps.length) {
      const sc = score(metrics.current)
      setReport({ at: new Date().toISOString(), padId: pad?.id ?? '', score: sc, metrics: Object.fromEntries(rows.map((r) => [r.label, r.value])) })
      setPhase('done')
    } else {
      setI(i + 1)
      setStartedAt(performance.now())
    }
  }
  useEffect(() => {
    if (phase !== 'running' || !step) return
    if (progress >= 1 || elapsed >= step.maxMs) advance()
  }, [progress, elapsed]) // eslint-disable-line react-hooks/exhaustive-deps

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
          <>
            <div className="row"><Badge tone="accent">Step {i + 1} of {steps.length}</Badge><h2>{step.title}</h2></div>
            <p>{step.instructions}</p>
            <div className="progress"><i style={{ width: `${progress * 100}%` }} /></div>
            <div className="row">
              <Button onClick={() => advance()}>Done, next</Button>
              <Button small onClick={() => advance(true)}>Skip</Button>
              <span className="dim small">auto-advances at {Math.round(step.maxMs / 1000)} s</span>
            </div>
          </>
        )}
        {phase === 'done' && report && (
          <>
            <div className="row" style={{ alignItems: 'baseline', gap: 16 }}>
              <span className="score" style={{ color: `var(--${report.score.grade === 'A' || report.score.grade === 'B' ? 'good' : report.score.grade === 'C' ? 'ok' : 'bad'})` }}>{report.score.score}</span>
              <span className="score dim">{report.score.grade}</span>
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
                <tr key={k}><td>{r.label}</td><td className="mono">{r.value}</td><td>{r.tone && <Badge tone={r.tone}>{r.tone}</Badge>}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}
