import { useEffect, useState, type ReactElement } from 'react'
import { identify } from '@/core/gamepad/identify'
import { PROFILES } from '@/core/gamepad/profiles'
import { Badge, Button, Card, Tabs } from '@/components/ui'
import { usePadRegistry } from '@/state/hooks'
import { useActivePad, useStore } from '@/state/store'
import { Overview } from '@/features/overview/Overview'
import { Sticks } from '@/features/sticks/Sticks'
import { Triggers } from '@/features/triggers/Triggers'
import { Buttons } from '@/features/buttons/Buttons'
import { Haptics } from '@/features/haptics/Haptics'
import { Wizard } from '@/features/wizard/Wizard'
import { Learn } from '@/features/learn/Learn'
import { Pro } from '@/features/pro/Pro'
import { Report } from '@/features/report/Report'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'sticks', label: 'Sticks' },
  { id: 'triggers', label: 'Triggers' },
  { id: 'buttons', label: 'Buttons' },
  { id: 'haptics', label: 'Rumble' },
  { id: 'wizard', label: 'Health check' },
  { id: 'pro', label: 'Pro Mode' },
  { id: 'learn', label: 'Learn mapping' },
  { id: 'report', label: 'Report' },
] as const
type Tab = (typeof TABS)[number]['id']

const SCREENS: Record<Tab, () => ReactElement | null> = { overview: Overview, sticks: Sticks, triggers: Triggers, buttons: Buttons, haptics: Haptics, wizard: Wizard, pro: Pro, learn: Learn, report: Report }

function Empty() {
  return (
    <Card>
      <div className="empty">
        <span className="icon">🎮</span>
        <h2>Connect a controller and press any button</h2>
        <p className="muted">USB or Bluetooth. Browsers only reveal a gamepad after its first input. Pro Mode works without this step in Chrome and Edge.</p>
        <table className="table" style={{ maxWidth: 560 }}>
          <thead><tr><th></th><th>Chrome / Edge</th><th>Firefox</th><th>Safari</th></tr></thead>
          <tbody>
            <tr><td>Buttons, sticks, triggers</td><td>✓</td><td>✓</td><td>✓</td></tr>
            <tr><td>Rumble</td><td>✓</td><td>partial</td><td>–</td></tr>
            <tr><td>Trigger rumble (Xbox)</td><td>✓ Win/mac</td><td>–</td><td>–</td></tr>
            <tr><td>Pro Mode (PS4/PS5 via WebHID)</td><td>✓ desktop</td><td>–</td><td>–</td></tr>
          </tbody>
        </table>
      </div>
    </Card>
  )
}

export default function App() {
  usePadRegistry()
  const pads = useStore((s) => s.pads)
  const pad = useActivePad()
  const setActive = useStore((s) => s.setActive)
  const theme = useStore((s) => s.settings.theme)
  const setSettings = useStore((s) => s.setSettings)
  const hid = useStore((s) => s.hid)
  const [tab, setTab] = useState<Tab>('overview')
  useEffect(() => { document.documentElement.dataset.theme = theme }, [theme])
  const profile = pad ? identify(pad.id) : null
  const Screen = SCREENS[tab]
  const needsPad = tab !== 'pro' && tab !== 'report'
  return (
    <div className="app">
      <header className="header">
        <h1>Controller Tester</h1>
        {profile && <Badge tone="accent">{PROFILES[profile.family].label}</Badge>}
        {pad && (pad.mapping === 'standard' ? <Badge tone="good">standard</Badge> : <Badge tone="ok">{pad.mapping || 'unmapped'}</Badge>)}
        {hid && <Badge tone="good">Pro: {hid.label}</Badge>}
        <span className="spacer" />
        {pads.length > 1 && (
          <select className="select" value={pad?.index ?? ''} onChange={(e) => setActive(Number(e.target.value))} aria-label="Active controller">
            {pads.map((p) => <option key={p.index} value={p.index}>{p.index}: {identify(p.id).name}</option>)}
          </select>
        )}
        <Button small onClick={() => setSettings({ theme: theme === 'dark' ? 'light' : 'dark' })} aria-label="Toggle theme">{theme === 'dark' ? '☀︎' : '☾'}</Button>
      </header>
      <Tabs tabs={[...TABS]} value={tab} onChange={setTab} />
      {needsPad && !pad ? <Empty /> : <Screen />}
      <footer className="small dim">Everything runs in your browser; nothing is uploaded. Report-rate and latency figures are what the browser observes, not what the hardware sends.</footer>
    </div>
  )
}
