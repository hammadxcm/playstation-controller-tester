import { identify } from '@/core/gamepad/identify'
import { PROFILES } from '@/core/gamepad/profiles'
import { hapticCaps } from '@/core/gamepad/haptics'
import { getGamepad } from '@/core/gamepad/poller'
import { Badge, Card } from '@/components/ui'
import { useStore } from '@/state/store'
import { useActivePad } from '@/state/hooks'
import { useState } from 'react'
import { Toggle } from '@/components/ui'
import { useSampled } from '@/state/hooks'
import { ControllerModel } from '@/features/model/ControllerModel'

export function Overview() {
  const pad = useActivePad()
  const hid = useStore((s) => s.hid)
  const [showValues, setShowValues] = useState(false)
  const gp = useSampled(() => (pad ? getGamepad(pad.index) : null), 2)
  if (!pad) return null
  const p = identify(pad.id)
  const caps = hapticCaps(gp)
  const isStd = pad.mapping === 'standard'
  return (
    <div className="grid-2">
      <Card
        title="Live view"
        right={
          p.family !== 'generic' && (
            <Toggle label="Show values" checked={showValues} onChange={setShowValues} />
          )
        }
      >
        <ControllerModel family={p.family} edge={!!hid?.caps.edge} showValues={showValues} />
        <p className="small muted">
          Press buttons and move sticks. Lightbar, player LEDs and mic light follow what Pro Mode
          sends.
        </p>
      </Card>
      <Card title="Device">
        <dl className="kv">
          <dt>Name</dt>
          <dd>{p.name}</dd>
          <dt>Family</dt>
          <dd>{PROFILES[p.family].label}</dd>
          <dt>Vendor / product</dt>
          <dd className="mono">
            {p.vid !== undefined
              ? `${p.vid.toString(16).padStart(4, '0')}:${p.pid?.toString(16).padStart(4, '0')}`
              : 'not exposed by this browser'}
          </dd>
          <dt>Mapping</dt>
          <dd>
            {isStd ? (
              <Badge tone="good">standard</Badge>
            ) : (
              <Badge tone="ok">{pad.mapping || 'none'} — use the Learn tab</Badge>
            )}
          </dd>
          <dt>Inputs</dt>
          <dd>{gp ? `${gp.buttons.length} buttons, ${gp.axes.length} axes` : '–'}</dd>
          <dt>Rumble</dt>
          <dd>
            {caps.dual ? <Badge tone="good">dual-rumble</Badge> : <Badge>none</Badge>}{' '}
            {caps.trigger && <Badge tone="good">trigger-rumble</Badge>}
          </dd>
          <dt>Raw id</dt>
          <dd className="mono small dim">{pad.id}</dd>
        </dl>
      </Card>
    </div>
  )
}
