import { Button } from '@/components/ui'
import { ArtworkModel } from '@/features/model/ArtworkModel'
import { useResolvedTheme } from '@/state/hooks'
import { useStore } from '@/state/store'
import { AddDevice } from './AddDevice'
import './landing.css'

export type LandingTab =
  'overview' | 'sticks' | 'triggers' | 'buttons' | 'haptics' | 'wizard' | 'pro' | 'learn' | 'report'

/** Front door: shown until a Gamepad-API pad or WebHID device is connected, or the user enters the shell. */
export function Landing({ onEnter }: { onEnter: (tab: LandingTab) => void }) {
  const theme = useResolvedTheme()
  const setSettings = useStore((s) => s.setSettings)
  return (
    <div className="landing">
      <div className="landing-bg" aria-hidden>
        <i />
        <i />
        <i />
      </div>
      <header className="landing-nav">
        <span className="brand">Controller Tester</span>
        <span className="spacer" />
        <Button small onClick={() => onEnter('pro')}>
          Pro Mode
        </Button>
        <Button small onClick={() => onEnter('report')}>
          Report
        </Button>
        <Button
          small
          onClick={() => setSettings({ theme: theme === 'dark' ? 'light' : 'dark' })}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? '☀︎' : '☾'}
        </Button>
      </header>
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow">Free · in-browser · nothing uploaded</p>
          <h1 id="hero-title" className="display">
            Every button, stick and trigger. Tested in seconds.
          </h1>
          <p className="lead muted">
            Drift, dead zones, circularity, polling rate, rumble and adaptive triggers for
            DualSense, DualSense Edge, DualShock 4, Xbox and any gamepad. No install, no account.
          </p>
          <div className="row hero-cta">
            <a className="btn btn-primary" href="#add-device">
              Add a device
            </a>
            <Button onClick={() => onEnter('pro')}>Open Pro Mode</Button>
          </div>
        </div>
        <div className="hero-art">
          <ArtworkModel kind="dualsense" />
        </div>
      </section>
      <AddDevice />
      <footer className="landing-footer small dim">
        <span>Everything runs in your browser; nothing is uploaded.</span>
        <a href="https://github.com/hammadxcm/playstation-controller-tester" rel="noopener">
          GitHub
        </a>
        <a
          href="https://github.com/hammadxcm/playstation-controller-tester/blob/main/LICENSES.md"
          rel="noopener"
        >
          Licences
        </a>
      </footer>
    </div>
  )
}
