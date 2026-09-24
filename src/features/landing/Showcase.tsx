import { useEffect, useRef, useState } from 'react'
import { useInView } from 'motion/react'
import * as m from 'motion/react-m'
import type { StdButton } from '@/core/gamepad/types'
import { ArtworkModel } from '@/features/model/ArtworkModel'
import type { ArtworkKind } from '@/features/model/artwork/specs'
import type { FrameSource } from '@/features/model/useControllerRig'
import { reducedMotion } from '@/lib/motion'
import { poseFrame } from './demoFrame'
import { ParallaxGlow } from './ParallaxGlow'

interface Callout {
  label: string
  x: number
  y: number
}
interface Item {
  kind: ArtworkKind
  name: string
  tagline: string
  /** standard buttons held while the card is hovered or focused */
  lit: readonly StdButton[]
  /** HID-only parts (paddles, Fn keys, mute) lit the same way */
  extra: readonly string[]
  sticks?: readonly number[]
  callouts: readonly Callout[]
  facts: readonly string[]
}

const ITEMS: readonly Item[] = [
  {
    kind: 'dualsense',
    name: 'DualSense',
    tagline: 'PS5 wireless controller',
    lit: ['l2', 'r2', 'touchpad'],
    extra: ['mute'],
    sticks: [0.35, -0.2, -0.3, 0.25],
    callouts: [
      { label: 'Adaptive triggers', x: 22, y: 6 },
      { label: 'Touchpad + lightbar', x: 50, y: 33 },
      { label: 'Mic mute', x: 50, y: 67 },
    ],
    facts: [
      'Adaptive trigger effects',
      'Lightbar + player LEDs',
      'Haptic rumble',
      'Gyro, accel, battery',
    ],
  },
  {
    kind: 'dualsenseEdge',
    name: 'DualSense Edge',
    tagline: 'PS5 pro controller',
    lit: ['l2', 'r2'],
    extra: ['paddleL', 'paddleR', 'fnL', 'fnR'],
    sticks: [-0.3, 0.3, 0.3, -0.3],
    callouts: [
      { label: 'Back paddles', x: 50, y: 92 },
      { label: 'Fn keys', x: 50, y: 66 },
      { label: 'Stick modules', x: 28, y: 52 },
    ],
    facts: [
      'Everything DualSense does',
      'Back paddles + Fn keys',
      'Trigger stops',
      'Swappable stick modules',
    ],
  },
  {
    kind: 'dualshock4',
    name: 'DualShock 4',
    tagline: 'PS4 wireless controller',
    lit: ['touchpad', 'south'],
    extra: [],
    sticks: [0.3, 0.3, -0.3, -0.3],
    callouts: [
      { label: 'Lightbar', x: 50, y: 10 },
      { label: 'Touchpad', x: 50, y: 30 },
      { label: 'Share / Options', x: 22, y: 26 },
    ],
    facts: [
      'Lightbar colour + flash',
      'Touchpad, gyro, accel',
      'Rumble',
      'USB, Bluetooth or dongle',
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
      aria-label={`${item.name}: ${item.facts.join(', ')}`}
    >
      <div className="show-art">
        {inView ? (
          <ArtworkModel kind={item.kind} compact source={(hot ? spot : rest).get(item.kind)} />
        ) : (
          <div className="model model-loading" />
        )}
        {item.callouts.map((c) => (
          <span key={c.label} className="callout" style={{ left: `${c.x}%`, top: `${c.y}%` }}>
            <i />
            {c.label}
          </span>
        ))}
      </div>
      <div className="show-copy">
        <h3>{item.name}</h3>
        <p className="small dim">{item.tagline}</p>
        <ul className="show-facts small muted">
          {item.facts.map((f) => (
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
  const reduce = reducedMotion()
  return (
    <section className="landing-section showcase" aria-labelledby="showcase-title">
      <ParallaxGlow />
      <h2 id="showcase-title" className="display">
        Built for PlayStation controllers
      </h2>
      <p className="muted lead">
        Accurate drawings of each pad light up as you press. Hover a card to see what Pro Mode can
        reach.
      </p>
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
