import { Button } from '@/components/ui'
import { LangPicker, ThemeButton, TopBarMenu } from '@/components/Chrome'
import { useT } from '@/i18n/useT'
import type { Tab } from '@/features/screens'
import { HeroArtwork } from './HeroArtwork'
import { AddDevice } from './AddDevice'
import { Showcase } from './Showcase'
import { FeatureTour } from './FeatureTour'
import './landing.css'

export type LandingTab = Tab

/** Front door: shown until a Gamepad-API pad or WebHID device is connected, or the user enters the shell. */
export function Landing({ onEnter }: { onEnter: (tab: LandingTab) => void }) {
  const t = useT()
  return (
    <div className="landing">
      <header className="landing-nav topbar">
        <span className="brand">{t('app.title')}</span>
        <span className="spacer" />
        <nav aria-label={t('app.title')}>
          <TopBarMenu>
            <Button small onClick={() => onEnter('pro')}>
              {t('nav.proMode')}
            </Button>
            <Button small onClick={() => onEnter('report')}>
              {t('nav.report')}
            </Button>
            <LangPicker />
            <ThemeButton />
          </TopBarMenu>
        </nav>
      </header>
      <main id="content" className="landing-main">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow">{t('hero.eyebrow')}</p>
            <h1 id="hero-title" className="display">
              {t('hero.title')}
            </h1>
            <p className="lead muted">{t('hero.lead')}</p>
            <div className="row hero-cta">
              <a className="btn btn-primary" href="#add-device">
                {t('hero.add')}
              </a>
              <Button onClick={() => onEnter('pro')}>{t('hero.pro')}</Button>
            </div>
          </div>
          <div className="hero-art">
            <HeroArtwork />
          </div>
        </section>
        <AddDevice />
        <Showcase />
        <FeatureTour onEnter={onEnter} />
      </main>
      <footer className="landing-footer small dim">
        <span>{t('footer.privacy')}</span>
        <a href="https://github.com/hammadxcm/playstation-controller-tester" rel="noopener">
          {t('footer.github')}
        </a>
        <a
          href="https://github.com/hammadxcm/playstation-controller-tester/blob/main/LICENSES.md"
          rel="noopener"
        >
          {t('footer.licences')}
        </a>
        <a
          className="version"
          href="https://github.com/hammadxcm/playstation-controller-tester/blob/main/CHANGELOG.md"
          rel="noopener"
        >
          v{__APP_VERSION__}
        </a>
      </footer>
    </div>
  )
}
