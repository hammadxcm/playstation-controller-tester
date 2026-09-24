import { useEffect, useRef, useState } from 'react'
import { useInView } from 'motion/react'
import * as m from 'motion/react-m'
import type { StdButton } from '@/core/gamepad/types'
import { ArtworkModel } from '@/features/model/ArtworkModel'
import type { ArtworkKind } from '@/features/model/artwork/specs'
import type { FrameSource } from '@/features/model/useControllerRig'
import { reducedMotion } from '@/lib/motion'
import { useT } from '@/i18n/useT'
import { poseFrame } from './demoFrame'
import { ParallaxGlow } from './ParallaxGlow'

interface Callout {
  x: number
  y: number
}
interface Item {
  kind: ArtworkKind
  /** standard buttons held while the card is hovered or focused */
  lit: readonly StdButton[]
  /** HID-only parts (paddles, Fn keys, mute) lit the same way */
  extra: readonly string[]
  sticks?: readonly number[]
  /** positions in % of the drawing; labels come from i18n `showcase.<kind>.callouts` */
  callouts: readonly Callout[]
}

const ITEMS: readonly Item[] = [
  {
    kind: 'dualsense',
    lit: ['l2', 'r2', 'touchpad'],
    extra: ['mute'],
    sticks: [0.35, -0.2, -0.3, 0.25],
    callouts: [
      { x: 22, y: 6 },
      { x: 50, y: 33 },
      { x: 50, y: 67 },
    ],
  },
  {
    kind: 'dualsenseEdge',
    lit: ['l2', 'r2'],
    extra: ['paddleL', 'paddleR', 'fnL', 'fnR'],
    sticks: [-0.3, 0.3, 0.3, -0.3],
    callouts: [
      { x: 50, y: 92 },
      { x: 50, y: 66 },
      { x: 28, y: 52 },
    ],
  },
  {
    kind: 'dualshock4',
    lit: ['touchpad', 'south'],
    extra: [],
    sticks: [0.3, 0.3, -0.3, -0.3],
    callouts: [
      { x: 50, y: 10 },
      { x: 50, y: 30 },
      { x: 22, y: 26 },
    ],
  },
]

// ponytail: sources are memoised per item so the rig keeps one subscription per card
const rest = new Map<ArtworkKind, FrameSource>()
const spot = new Map<ArtworkKind, FrameSource>()
for (const it of ITEMS) {
  const idle = poseFrame([], it.sticks)
  const lit = poseFrame(it.lit, it.sticks)
  rest.set(it.kind, (cb) => {
    cb(idle)
    return () => {}
  })
  spot.set(it.kind, (cb) => {
    cb(lit)
    return () => {}
  })
}

const hover = {
  scale: 1.04,
  rotateX: 3,
  rotateY: -3,
  transition: { duration: 0.35, ease: [0.33, 1, 0.68, 1] as const },
}

function ShowcaseCard({ item }: { item: Item }) {
  const t = useT()
  const name = t(`showcase.${item.kind}.name`)
  const facts = t.list(`showcase.${item.kind}.facts`)
  const labels = t.list(`showcase.${item.kind}.callouts`)
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref, { once: true, margin: '200px' })
  const [hot, setHot] = useState(false)
  // HID-only parts have no frame path; flip their data-on directly, exactly as the rig would.
  useEffect(() => {
    const root = ref.current
    if (!root) return
    for (const k of item.extra)
      root
        .querySelectorAll(`[data-part="x:${k}"]`)
        .forEach((el) => el.setAttribute('data-on', String(hot)))
  }, [hot, item.extra, inView])
  return (
    <m.article
      ref={ref}
      className="card show-card"
      data-hot={hot}
      whileHover={hover}
      whileFocus={hover}
      tabIndex={0}
      onPointerEnter={() => setHot(true)}
      onPointerLeave={() => setHot(false)}
      onFocus={() => setHot(true)}
      onBlur={() => setHot(false)}
      aria-label={`${name}: ${facts.join(', ')}`}
    >
      <div className="show-art">
        {inView ? (
          <ArtworkModel kind={item.kind} compact source={(hot ? spot : rest).get(item.kind)} />
        ) : (
          <div className="model model-loading" />
        )}
        {item.callouts.map((c, i) => (
          <span key={i} className="callout" style={{ left: `${c.x}%`, top: `${c.y}%` }}>
            <i />
            {labels[i]}
          </span>
        ))}
      </div>
      <div className="show-copy">
        <h3>{name}</h3>
        <p className="small dim">{t(`showcase.${item.kind}.tagline`)}</p>
        <ul className="show-facts small muted">
          {facts.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      </div>
    </m.article>
  )
}

const list = { hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } } }
const itemV = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.33, 1, 0.68, 1] as const } },
}

/** The three Sony pads with their artwork, callouts lit on hover; chunks load only as the section scrolls near. */
export function Showcase() {
  const t = useT()
  const reduce = reducedMotion()
  return (
    <section className="landing-section showcase" aria-labelledby="showcase-title">
      <ParallaxGlow />
      <h2 id="showcase-title" className="display">
        {t('showcase.title')}
      </h2>
      <p className="muted lead">{t('showcase.lead')}</p>
      <m.div
        className="show-grid"
        variants={list}
        initial={reduce ? 'show' : 'hidden'}
        whileInView="show"
        viewport={{ once: true, margin: '-10% 0px' }}
      >
        {ITEMS.map((it) => (
          <m.div key={it.kind} variants={itemV}>
            <ShowcaseCard item={it} />
          </m.div>
        ))}
      </m.div>
    </section>
  )
}
