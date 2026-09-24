import { Fragment, useRef, useState } from 'react'
import { deleteLayout, emptyLayout, saveLayout, type Layout } from '@/core/gamepad/mapping'
import { identify } from '@/core/gamepad/identify'
import { PROFILES } from '@/core/gamepad/profiles'
import { STD_AXES, STD_BUTTONS, type Frame } from '@/core/gamepad/types'
import { Badge, Button, Card } from '@/components/ui'
import { useRawFrame } from '@/state/hooks'
import { useStore } from '@/state/store'
import { useActivePad } from '@/state/hooks'

type Target = { kind: 'button'; key: (typeof STD_BUTTONS)[number] } | { kind: 'axis'; key: (typeof STD_AXES)[number] }
const TARGETS: Target[] = [...STD_BUTTONS.map((key) => ({ kind: 'button', key }) as Target), ...STD_AXES.map((key) => ({ kind: 'axis', key }) as Target)]

export function Learn() {
  const pad = useActivePad()
  const refresh = useStore((s) => s.refreshLayout)
  const existing = useStore((s) => s.layout)
  const [i, setI] = useState<number | null>(null)
  const layout = useRef<Layout>(emptyLayout())
  const baseline = useRef<Frame | null>(null)
  const settle = useRef(false)
  const finish = () => { if (pad) saveLayout(pad.id, layout.current); refresh(); setI(null) }

  useRawFrame((f) => {
    if (i === null) return
    const t = TARGETS[i]
    if (!t) return
    if (settle.current) {
      const quiet = f.buttons.every((b) => !b.pressed) && f.axes.every((a, k) => Math.abs(a - (baseline.current?.axes[k] ?? 0)) < 0.3)
      if (!quiet) return
      settle.current = false
      baseline.current = f
      return
    }
    if (!baseline.current) { baseline.current = f; return }
    let hit = -1
    if (t.kind === 'button') hit = f.buttons.findIndex((b, k) => b.pressed && !baseline.current!.buttons[k]?.pressed)
    else hit = f.axes.findIndex((a, k) => Math.abs(a - (baseline.current!.axes[k] ?? 0)) > 0.6)
    if (hit < 0) return
    if (t.kind === 'button') layout.current.buttons[t.key] = hit
    else layout.current.axes[t.key] = hit
    settle.current = true
    setI(i + 1 < TARGETS.length ? i + 1 : null)
    if (i + 1 >= TARGETS.length) finish()
  })

  if (!pad) return null
  const labels = PROFILES[identify(pad.id).family].buttons
  const start = () => { layout.current = emptyLayout(); baseline.current = null; settle.current = false; setI(0) }
  const skip = () => { settle.current = true; if (i !== null && i + 1 < TARGETS.length) setI(i + 1); else finish() }
  const t = i !== null ? TARGETS[i] : undefined
  return (
    <div className="grid-2">
      <Card title="Learn mapping" right={pad.mapping === 'standard' ? <Badge tone="good">standard mapping, not needed</Badge> : existing ? <Badge tone="good">learned layout active</Badge> : <Badge tone="ok">no mapping</Badge>}>
        <p className="muted">For controllers the browser doesn't recognise ("mapping" is empty), press each control as prompted and the app records which raw index it uses. The layout is saved in this browser and applied everywhere.</p>
        {t ? (
          <>
            <h2>{t.kind === 'button' ? `Press ${labels[t.key]}` : `Move ${t.key.toUpperCase()} axis (${t.key[0] === 'l' ? 'left' : 'right'} stick ${t.key[1] === 'x' ? 'right' : 'down'})`}</h2>
            <div className="progress"><i style={{ width: `${((i ?? 0) / TARGETS.length) * 100}%` }} /></div>
            <div className="row"><Button onClick={skip}>Skip</Button><Button small onClick={() => setI(null)}>Cancel</Button></div>
          </>
        ) : (
          <div className="row">
            <Button primary onClick={start}>Start learning</Button>
            {existing && <Button onClick={() => { deleteLayout(pad.id); refresh() }}>Forget layout</Button>}
          </div>
        )}
      </Card>
      {existing && (
        <Card title="Current layout">
          <dl className="kv">
            {STD_BUTTONS.map((b) => <Fragment key={b}><dt>{labels[b]}</dt><dd className="mono">{existing.buttons[b] >= 0 ? `button ${existing.buttons[b]}` : '–'}</dd></Fragment>)}
            {STD_AXES.map((a) => <Fragment key={a}><dt>{a}</dt><dd className="mono">{existing.axes[a] >= 0 ? `axis ${existing.axes[a]}` : '–'}</dd></Fragment>)}
          </dl>
        </Card>
      )}
    </div>
  )
}
