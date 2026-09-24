import * as m from 'motion/react-m'
import { reducedMotion } from '@/lib/motion'
import type { LandingTab } from './Landing'
import { ParallaxGlow } from './ParallaxGlow'

const TILES: readonly {
  tab: LandingTab
  title: string
  blurb: string
  glyph: string
  free?: boolean
}[] = [
  {
    tab: 'sticks',
    title: 'Sticks',
    blurb: 'Drift, dead zone, circularity and resolution with a live trace.',
    glyph: '◎',
  },
  {
    tab: 'triggers',
    title: 'Triggers',
    blurb: 'Travel curves, latency and adaptive-trigger effects.',
    glyph: '⌒',
  },
  {
    tab: 'buttons',
    title: 'Buttons',
    blurb: 'Every input with chatter and stuck-button detection.',
    glyph: '✕',
  },
  {
    tab: 'haptics',
    title: 'Rumble',
    blurb: 'Dual-rumble and trigger-rumble patterns, on demand.',
    glyph: '∿',
  },
  {
    tab: 'wizard',
    title: 'Health check',
    blurb: 'Six guided steps to a 0–100 score you can export.',
    glyph: '✓',
  },
  {
    tab: 'pro',
    title: 'Pro Mode',
    blurb: 'WebHID: lightbar, LEDs, mic, touchpad, gyro, battery.',
    glyph: '⚡',
    free: true,
  },
  {
    tab: 'learn',
    title: 'Learn mapping',
    blurb: 'Teach the app a pad without a standard layout.',
    glyph: '⌘',
  },
  {
    tab: 'report',
    title: 'Report',
    blurb: 'Your last health check as a shareable image.',
    glyph: '▤',
    free: true,
  },
]

const list = { hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } } }
const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.33, 1, 0.68, 1] as const } },
}
const focus = { scale: 1.04, transition: { duration: 0.35, ease: [0.33, 1, 0.68, 1] as const } }

/** PS5-style tile row: every screen in the app, one tap away. Pad-only tiles open the shell's connect state. */
export function FeatureTour({ onEnter }: { onEnter: (tab: LandingTab) => void }) {
  const reduce = reducedMotion()
  return (
    <section className="landing-section tour" aria-labelledby="tour-title">
      <ParallaxGlow range={32} />
      <h2 id="tour-title" className="display">
        Everything the app can test
      </h2>
      <m.div
        className="tile-grid"
        variants={list}
        initial={reduce ? 'show' : 'hidden'}
        whileInView="show"
        viewport={{ once: true, margin: '-10% 0px' }}
      >
        {TILES.map((t) => (
          <m.button
            key={t.tab}
            type="button"
            className="tile"
            variants={item}
            whileHover={focus}
            whileFocus={focus}
            whileTap={{ scale: 0.98 }}
            onClick={() => onEnter(t.tab)}
          >
            <span className="tile-halo" aria-hidden />
            <span className="tile-glyph" aria-hidden>
              {t.glyph}
            </span>
            <span className="tile-title">{t.title}</span>
            <span className="tile-blurb small muted">{t.blurb}</span>
            {t.free && <span className="tile-tag">No pad needed</span>}
          </m.button>
        ))}
      </m.div>
    </section>
  )
}
