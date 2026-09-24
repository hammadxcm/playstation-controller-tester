import { useRef } from 'react'
import { ButtonTracker } from '@/core/analysis'
import { identify } from '@/core/gamepad/identify'
import { PROFILES } from '@/core/gamepad/profiles'
import { STD_BUTTONS } from '@/core/gamepad/types'
import { Badge, Button, Card } from '@/components/ui'
import { useFrame, useSampled } from '@/state/hooks'
import { useActivePad } from '@/state/store'

export function Buttons() {
  const pad = useActivePad()
  const tracker = useRef(new ButtonTracker())
  const cells = useRef<(HTMLDivElement | null)[]>([])
  const axesRef = useRef<HTMLDivElement>(null)
  const count = useRef({ buttons: 0, axes: 0 })
  useFrame((f) => {
    count.current = { buttons: f.buttons.length, axes: f.axes.length }
    f.buttons.forEach((b, i) => {
      tracker.current.feed(i, b.pressed, f.t)
      cells.current[i]?.setAttribute('data-on', String(b.pressed))
    })
    if (axesRef.current) {
      const kids = axesRef.current.children
      f.axes.forEach((a, i) => {
        const el = kids[i] as HTMLElement | undefined
        if (!el) return
        el.querySelector('.bar > i')?.setAttribute('style', `width:${((a + 1) / 2) * 100}%`)
        el.querySelector('.stat')!.textContent = a.toFixed(4)
      })
    }
  })
  const stats = useSampled(() => ({ s: tracker.current.all().map((x) => ({ ...x })), ...count.current }), 6)
  if (!pad) return null
  const labels = PROFILES[identify(pad.id).family].buttons
  const std = pad.mapping === 'standard' || pad.mapping === 'learned'
  const n = Math.max(stats.buttons, std ? STD_BUTTONS.length : 0)
  const chatter = stats.s.reduce((a, b) => a + b.chatter, 0)
  const stuck = stats.s.filter((b) => b.stuck).length
  return (
    <div className="stack">
      <Card
        title="Buttons"
        right={
          <div className="row">
            {chatter ? <Badge tone="bad">{chatter} chatter</Badge> : <Badge tone="good">no chatter</Badge>}
            {stuck ? <Badge tone="bad">{stuck} stuck</Badge> : null}
            <Button small onClick={() => tracker.current.reset()}>Reset</Button>
          </div>
        }
      >
        <div className="btn-grid">
          {Array.from({ length: n }, (_, i) => {
            const st = stats.s[i]
            const name = std ? labels[STD_BUTTONS[i]!] ?? `B${i}` : `B${i}`
            return (
              <div key={i} ref={(el) => { cells.current[i] = el }} className="btn-cell" data-on="false">
                <span className="name">{name}</span>
                <span className="stat">{st?.presses ?? 0}×{st?.chatter ? ` ⚠${st.chatter}` : ''}</span>
                <span className="stat">{st?.longestHoldMs ? `${Math.round(st.longestHoldMs)} ms` : '–'}</span>
              </div>
            )
          })}
        </div>
        <p className="small muted">Press each button a few times. Chatter is a re-press within 20 ms of release, the signature of a worn switch. Stuck flags a button held over 10 s.</p>
      </Card>
      <Card title={`Raw axes (${stats.axes})`}>
        <div className="stack" ref={axesRef}>
          {Array.from({ length: stats.axes }, (_, i) => (
            <div key={i} className="row">
              <span className="mono small" style={{ width: 60 }}>axis {i}</span>
              <div className="bar" style={{ flex: 1 }}><i /></div>
              <span className="stat mono small" style={{ width: 70, textAlign: 'right' }}>0.0000</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
