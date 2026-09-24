import * as m from 'motion/react-m'
import { reducedMotion } from '@/lib/motion'
import { useT } from '@/i18n/useT'
import { preloadScreen } from '@/features/screens'
import type { LandingTab } from './Landing'
import { ParallaxGlow } from './ParallaxGlow'

const TILES: readonly { tab: LandingTab; glyph: string; free?: boolean }[] = [
  { tab: 'sticks', glyph: '◎' },
  { tab: 'triggers', glyph: '⌒' },
  { tab: 'buttons', glyph: '✕' },
  { tab: 'haptics', glyph: '∿' },
  { tab: 'wizard', glyph: '✓' },
  { tab: 'pro', glyph: '⚡', free: true },
  { tab: 'learn', glyph: '⌘' },
  { tab: 'report', glyph: '▤', free: true },
]

// ponytail: warm the screen chunk while the pointer is still deciding; the import is cached so the click is instant
const preload = (tab: LandingTab) => void preloadScreen(tab)

const list = { hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } } }
const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.33, 1, 0.68, 1] as const } },
}
const focus = { scale: 1.04, transition: { duration: 0.35, ease: [0.33, 1, 0.68, 1] as const } }

/** PS5-style tile row: every screen in the app, one tap away. Pad-only tiles open the shell's connect state. */
export function FeatureTour({ onEnter }: { onEnter: (tab: LandingTab) => void }) {
  const t = useT()
  const reduce = reducedMotion()
  return (
    <section className="landing-section tour" aria-labelledby="tour-title">
      <ParallaxGlow range={32} />
      <h2 id="tour-title" className="display">
        {t('tour.title')}
      </h2>
      <m.div
        className="tile-grid"
        variants={list}
        initial={reduce ? 'show' : 'hidden'}
        whileInView="show"
        viewport={{ once: true, margin: '-10% 0px' }}
      >
        {TILES.map((tile) => (
          <m.button
            key={tile.tab}
            type="button"
            className="tile"
            variants={item}
            whileHover={focus}
            whileFocus={focus}
            whileTap={{ scale: 0.98 }}
            onClick={() => onEnter(tile.tab)}
            onPointerEnter={() => preload(tile.tab)}
            onFocus={() => preload(tile.tab)}
          >
            <span className="tile-halo" aria-hidden />
            <span className="tile-glyph" aria-hidden>
              {tile.glyph}
            </span>
            <span className="tile-title">{t(`tour.${tile.tab}.title`)}</span>
            <span className="tile-blurb small muted">{t(`tour.${tile.tab}.blurb`)}</span>
            {tile.free && <span className="tile-tag">{t('tour.noPad')}</span>}
          </m.button>
        ))}
      </m.div>
    </section>
  )
}
