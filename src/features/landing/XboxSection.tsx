import { useEffect, useRef, useState } from 'react'
import { useInView } from 'motion/react'
import * as m from 'motion/react-m'
import { ArtworkModel } from '@/features/model/ArtworkModel'
import type { FrameSource } from '@/features/model/useControllerRig'
import { reducedMotion } from '@/lib/motion'
import { useT } from '@/i18n/useT'
import { poseFrame } from './demoFrame'
import { ParallaxGlow } from './ParallaxGlow'

const STICKS = [0.3, -0.25, -0.3, 0.2] as const
const idle = poseFrame([], STICKS)
// `touchpad` is the aux slot the Xbox geometry draws as the Share button
const lit = poseFrame(['l2', 'r2', 'home', 'touchpad'], STICKS)
const REST: FrameSource = (cb) => {
  cb(idle)
  return () => {}
}
const SPOT: FrameSource = (cb) => {
  cb(lit)
  return () => {}
}
const PADDLES = ['p1', 'p2', 'p3', 'p4'] as const
/** positions in % of the drawing; labels come from i18n `xbox.callouts` */
const CALLOUTS = [
  { x: 27, y: 4 },
  { x: 50, y: 25 },
  { x: 50, y: 58 },
  { x: 72, y: 78 },
] as const

const hover = {
  scale: 1.03,
  rotateX: 3,
  rotateY: 3,
  transition: { duration: 0.35, ease: [0.33, 1, 0.68, 1] as const },
}
const list = { hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } } }
const itemV = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.33, 1, 0.68, 1] as const } },
}

const ROWS = [
  { key: 'buttons', gamepad: 'yes', pro: 'hires' },
  { key: 'triggerRumble', gamepad: 'chrome', pro: 'yes' },
  { key: 'battery', gamepad: 'no', pro: 'yes' },
  { key: 'paddles', gamepad: 'no', pro: 'yes' },
  { key: 'raw', gamepad: 'no', pro: 'yes' },
] as const

/** Xbox pads: the line-art drawing with impulse triggers, Xbox button, Share and Elite paddles lit on hover, plus what each path can reach. */
export function XboxSection() {
  const t = useT()
  const reduce = reducedMotion()
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref, { once: true, margin: '200px' })
  const [hot, setHot] = useState(false)
  // Elite paddles are HID-only parts with no frame path; flip their data-on directly, as the rig would.
  useEffect(() => {
    const root = ref.current
    if (!root) return
    for (const k of PADDLES)
      root
        .querySelectorAll(`[data-part="x:${k}"]`)
        .forEach((el) => el.setAttribute('data-on', String(hot)))
  }, [hot, inView])
  const name = t('xbox.name')
  const facts = t.list('xbox.facts')
  const labels = t.list('xbox.callouts')
  const cell = (v: (typeof ROWS)[number]['gamepad' | 'pro']) =>
    v === 'yes' ? '✓' : v === 'no' ? '–' : `✓ ${t(`xbox.matrix.${v}`)}`
  return (
    <section
      id="xbox-section"
      className="landing-section xbox-section"
      aria-labelledby="xbox-title"
    >
      <ParallaxGlow />
      <h2 id="xbox-title" className="display">
        {t('xbox.title')}
      </h2>
      <p className="muted lead">{t('xbox.lead')}</p>
      <m.div
        className="xbox-grid"
        variants={list}
        initial={reduce ? 'show' : 'hidden'}
        whileInView="show"
        viewport={{ once: true, margin: '-10% 0px' }}
      >
        <m.article
          ref={ref}
          variants={itemV}
          className="card show-card xbox-card"
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
              <ArtworkModel kind="xbox" compact source={hot ? SPOT : REST} label={name} />
            ) : (
              <div className="model model-loading" />
            )}
            {CALLOUTS.map((c, i) => (
              <span key={i} className="callout" style={{ left: `${c.x}%`, top: `${c.y}%` }}>
                <i />
                {labels[i]}
              </span>
            ))}
          </div>
          <div className="show-copy">
            <h3>{name}</h3>
            <p className="small dim">{t('xbox.tagline')}</p>
            <ul className="show-facts small muted">
              {facts.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>
        </m.article>
        <m.div variants={itemV} className="card xbox-matrix">
          <table className="table support-table">
            <caption className="visually-hidden">{t('xbox.matrix.feature')}</caption>
            <thead>
              <tr>
                <th scope="col">{t('xbox.matrix.feature')}</th>
                <th scope="col">{t('xbox.matrix.gamepad')}</th>
                <th scope="col">{t('xbox.matrix.pro')}</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r.key}>
                  <th scope="row">{t(`xbox.matrix.${r.key}`)}</th>
                  <td>{cell(r.gamepad)}</td>
                  <td>{cell(r.pro)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="small dim">{t('xbox.note')}</p>
        </m.div>
      </m.div>
    </section>
  )
}
