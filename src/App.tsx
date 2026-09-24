import { Suspense, useEffect } from 'react'
import { AnimatePresence } from 'motion/react'
import * as m from 'motion/react-m'
import { identify } from '@/core/gamepad/identify'
import { PROFILES } from '@/core/gamepad/profiles'
import { Badge, Button, Card, Tabs } from '@/components/ui'
import { Ambient, LangPicker, SkipLink, ThemeButton } from '@/components/Chrome'
import { useDocumentLang } from '@/i18n/useT'
import { useT } from '@/i18n/useT'
import {
  useActivePad,
  useHashTab,
  useLandingVisible,
  usePadRegistry,
  useResolvedTheme,
} from '@/state/hooks'
import { Landing } from '@/features/landing/Landing'
import { applyTheme } from '@/lib/theme'
import { transition } from '@/lib/viewTransition'
import { useStore } from '@/state/store'

import { SCREENS, TAB_IDS, type Tab } from '@/features/screens'

function Empty() {
  const t = useT()
  return (
    <Card>
      <div className="empty">
        <span className="listen-dot big" aria-hidden />
        <h2>{t('shell.emptyTitle')}</h2>
        <p className="muted">{t('shell.emptyBody')}</p>
      </div>
    </Card>
  )
}

/** Landing ↔ shell crossfade. PS5-ish: short, ease-out, a hair of scale; reduced motion keeps only the fade. */
const fade = {
  initial: { opacity: 0, scale: 0.985 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.985 },
  transition: { duration: 0.42, ease: [0.33, 1, 0.68, 1] as const },
}
const rise = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.38, ease: [0.33, 1, 0.68, 1] as const },
}

export default function App() {
  usePadRegistry()
  useDocumentLang()
  const t = useT()
  const pads = useStore((s) => s.pads)
  const pad = useActivePad()
  const setActive = useStore((s) => s.setActive)
  const theme = useResolvedTheme()
  const hid = useStore((s) => s.hid)
  const setEntered = useStore((s) => s.setEntered)
  const landing = useLandingVisible()
  const [tab, setTab] = useHashTab<Tab>(TAB_IDS, 'overview')
  useEffect(() => applyTheme(theme), [theme])
  const profile = pad ? identify(pad.id) : null
  const Screen = SCREENS[tab]
  const needsPad = tab !== 'pro' && tab !== 'report'
  // Deep links into the device-free screens skip the landing.
  useEffect(() => {
    if (!needsPad) setEntered(true)
  }, [needsPad, setEntered])
  const go = (next: Tab) => {
    if (next === tab) return
    const dir = TAB_IDS.indexOf(next) > TAB_IDS.indexOf(tab) ? 'fwd' : 'back'
    void transition(() => setTab(next), dir)
  }
  const enter = (next: Tab) => {
    setEntered(true)
    setTab(next)
  }
  const tabs = TAB_IDS.map((id) => ({ id, label: t(`tabs.${id}`) }))
  return (
    <>
      <SkipLink />
      <Ambient />
      <AnimatePresence mode="wait" initial={false}>
        {landing ? (
          <m.div key="landing" {...fade}>
            <Landing onEnter={enter} />
          </m.div>
        ) : (
          <m.div
            key="shell"
            {...fade}
            className="app"
            data-family={profile?.family ?? (hid ? hid.family : undefined)}
          >
            <header className="header topbar">
              <h1 className="brand">{t('app.title')}</h1>
              {profile && <Badge tone="accent">{PROFILES[profile.family].label}</Badge>}
              {pad &&
                (pad.mapping === 'standard' ? (
                  <Badge tone="good">{t('shell.standard')}</Badge>
                ) : (
                  <Badge tone="ok">{pad.mapping || t('shell.unmapped')}</Badge>
                ))}
              {hid && (
                <Badge tone="good">
                  {t('shell.pro')}: {hid.label}
                </Badge>
              )}
              <span className="spacer" />
              {pads.length > 1 && (
                <select
                  className="select"
                  value={pad?.index ?? ''}
                  onChange={(e) => setActive(Number(e.target.value))}
                  aria-label={t('nav.activePad')}
                >
                  {pads.map((p) => (
                    <option key={p.index} value={p.index}>
                      {p.index}: {identify(p.id).name}
                    </option>
                  ))}
                </select>
              )}
              {!pad && !hid && (
                <Button small onClick={() => setEntered(false)}>
                  {t('nav.home')}
                </Button>
              )}
              <LangPicker />
              <ThemeButton />
            </header>
            <nav aria-label={t('app.title')}>
              <Tabs tabs={tabs} value={tab} onChange={go} />
            </nav>
            <main
              key={tab}
              id="content"
              role="tabpanel"
              aria-labelledby={`tab-${tab}`}
              className="screen"
              style={{ viewTransitionName: 'screen' }}
            >
              <m.div {...rise}>
                <Suspense fallback={<div className="screen-loading" aria-busy="true" />}>
                  {needsPad && !pad ? <Empty /> : <Screen />}
                </Suspense>
              </m.div>
            </main>
            <footer className="small dim">{t('shell.footer')}</footer>
          </m.div>
        )}
      </AnimatePresence>
    </>
  )
}
