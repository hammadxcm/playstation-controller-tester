import { useEffect, type ReactElement } from 'react'
import { identify } from '@/core/gamepad/identify'
import { PROFILES } from '@/core/gamepad/profiles'
import { Badge, Button, Card, Tabs } from '@/components/ui'
import { useHashTab, useLandingVisible, usePadRegistry, useResolvedTheme } from '@/state/hooks'
import { AnimatePresence } from 'motion/react'
import * as m from 'motion/react-m'
import { Landing } from '@/features/landing/Landing'
import { applyTheme } from '@/lib/theme'
import { transition } from '@/lib/viewTransition'
import { useStore } from '@/state/store'
import { useActivePad } from '@/state/hooks'
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
const TAB_IDS = TABS.map((t) => t.id)

const SCREENS: Record<Tab, () => ReactElement | null> = { overview: Overview, sticks: Sticks, triggers: Triggers, buttons: Buttons, haptics: Haptics, wizard: Wizard, pro: Pro, learn: Learn, report: Report }

function Empty() {
  return (
    <Card>
      <div className="empty">
        <span className="icon">🎮</span>
        <h2>Connect a controller and press any button</h2>
        <p className="muted">USB or Bluetooth. Browsers only reveal a gamepad after its first input. Pro Mode works without this step in Chrome and Edge.</p>
      </div>
    </Card>
  )
}

/** Landing ↔ shell crossfade. PS5-ish: short, ease-out, a hair of scale; reduced motion keeps only the fade. */
const fade = { initial: { opacity: 0, scale: 0.985 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.985 }, transition: { duration: 0.42, ease: [0.33, 1, 0.68, 1] as const } }

export default function App() {
  usePadRegistry()
  const pads = useStore((s) => s.pads)
  const pad = useActivePad()
  const setActive = useStore((s) => s.setActive)
  const theme = useResolvedTheme()
  const setSettings = useStore((s) => s.setSettings)
  const hid = useStore((s) => s.hid)
  const setEntered = useStore((s) => s.setEntered)
  const landing = useLandingVisible()
  const [tab, setTab] = useHashTab<Tab>(TAB_IDS, 'overview')
  useEffect(() => applyTheme(theme), [theme])
  const profile = pad ? identify(pad.id) : null
  const Screen = SCREENS[tab]
  const needsPad = tab !== 'pro' && tab !== 'report'
  // Deep links into the device-free screens skip the landing.
  useEffect(() => { if (!needsPad) setEntered(true) }, [needsPad, setEntered])
  const go = (next: Tab) => {
    if (next === tab) return
    const dir = TABS.findIndex((t) => t.id === next) > TABS.findIndex((t) => t.id === tab) ? 'fwd' : 'back'
    void transition(() => setTab(next), dir)
  }
  const enter = (next: Tab) => {
    setEntered(true)
    setTab(next)
  }
  return (
    <AnimatePresence mode="wait" initial={false}>
      {landing ? (
        <m.div key="landing" {...fade}>
          <Landing onEnter={enter} />
        </m.div>
      ) : (
        <m.div key="shell" {...fade} className="app" data-family={profile?.family ?? (hid ? hid.family : undefined)}>
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
            {!pad && !hid && <Button small onClick={() => setEntered(false)}>Home</Button>}
            <Button small onClick={() => setSettings({ theme: theme === 'dark' ? 'light' : 'dark' })} aria-label="Toggle theme">{theme === 'dark' ? '☀︎' : '☾'}</Button>
          </header>
          <Tabs tabs={[...TABS]} value={tab} onChange={go} />
          <main key={tab} id={`panel-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`} className="screen" style={{ viewTransitionName: 'screen' }}>
            {needsPad && !pad ? <Empty /> : <Screen />}
          </main>
          <footer className="small dim">Everything runs in your browser; nothing is uploaded. Report-rate and latency figures are what the browser observes, not what the hardware sends.</footer>
        </m.div>
      )}
    </AnimatePresence>
  )
}
