import { useEffect, useRef, useState } from 'react'
import { animate } from '@/lib/motion'
import { ButtonTracker } from '@/core/analysis'
import { identify } from '@/core/gamepad/identify'
import { PROFILES } from '@/core/gamepad/profiles'
import { STD_BUTTONS } from '@/core/gamepad/types'
import { Badge, Button, Card } from '@/components/ui'
import { useFrame, useSampled } from '@/state/hooks'
import { useActivePad } from '@/state/hooks'

export function Buttons() {
  const pad = useActivePad()
  const tracker = useRef(new ButtonTracker())
  const cells = useRef<(HTMLDivElement | null)[]>([])
  const axisFill = useRef<(HTMLElement | null)[]>([])
  const axisText = useRef<(HTMLElement | null)[]>([])
  const wasDown = useRef<boolean[]>([])
  const count = useRef({ buttons: 0, axes: 0 })
  useFrame((f) => {
    count.current = { buttons: f.buttons.length, axes: f.axes.length }
    f.buttons.forEach((b, i) => {
      tracker.current.feed(i, b.pressed, f.t)
      const cell = cells.current[i]
      if (b.pressed !== wasDown.current[i]) {
        wasDown.current[i] = b.pressed
        cell?.setAttribute('data-on', String(b.pressed))
        const ripple = cell?.querySelector('.ripple')
        if (b.pressed && ripple)
          animate(
            ripple,
            [
              { transform: 'scale(1)', opacity: 0.5 },
              { transform: 'scale(14)', opacity: 0 },
            ],
            { duration: 420, easing: 'cubic-bezier(.16,1,.3,1)' },
          )
      }
    })
    f.axes.forEach((a, i) => {
      axisFill.current[i]?.style.setProperty('width', `${((a + 1) / 2) * 100}%`)
      const t = axisText.current[i]
      if (t) t.textContent = a.toFixed(4)
    })
  })
  const stats = useSampled(
    () => ({ s: tracker.current.all().map((x) => ({ ...x })), ...count.current }),
    6,
  )
  const [shake, setShake] = useState(0)
  const prevChatter = useRef(0)
  const chatterNow = stats.s.reduce((a, b) => a + b.chatter, 0)
  useEffect(() => {
    if (chatterNow > prevChatter.current) setShake((n) => n + 1)
    prevChatter.current = chatterNow
  }, [chatterNow])
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
            {chatter ? (
              <span key={shake} className="badge badge-bad" data-shake="">
                {chatter} chatter
              </span>
            ) : (
              <Badge tone="good">no chatter</Badge>
            )}
            {stuck ? (
              <span className="badge badge-bad" data-pulse="">
                {stuck} stuck
              </span>
            ) : null}
            <Button small onClick={() => tracker.current.reset()}>
              Reset
            </Button>
          </div>
        }
      >
        <div className="btn-grid">
          {Array.from({ length: n }, (_, i) => {
            const st = stats.s[i]
            const name = std ? (labels[STD_BUTTONS[i]!] ?? `B${i}`) : `B${i}`
            return (
              <div
                key={i}
                ref={(el) => {
                  cells.current[i] = el
                }}
                className="btn-cell"
                data-on="false"
              >
                <i className="ripple" />
                <span className="name">{name}</span>
                <span className="stat">
                  {st?.presses ?? 0}×{st?.chatter ? ` ⚠${st.chatter}` : ''}
                </span>
                <span className="stat">
                  {st?.longestHoldMs ? `${Math.round(st.longestHoldMs)} ms` : '–'}
                </span>
              </div>
            )
          })}
        </div>
        <p className="small muted">
          Press each button a few times. Chatter is a re-press within 20 ms of release, the
          signature of a worn switch. Stuck flags a button held over 10 s.
        </p>
      </Card>
      <Card title={`Raw axes (${stats.axes})`}>
        <div className="stack">
          {Array.from({ length: stats.axes }, (_, i) => (
            <div key={i} className="row">
              <span className="mono small" style={{ width: 60 }}>
                axis {i}
              </span>
              <div className="bar" style={{ flex: 1 }}>
                <i
                  ref={(el) => {
                    axisFill.current[i] = el
                  }}
                />
              </div>
              <span
                ref={(el) => {
                  axisText.current[i] = el
                }}
                className="stat mono small"
                style={{ width: 70, textAlign: 'right' }}
              >
                0.0000
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
