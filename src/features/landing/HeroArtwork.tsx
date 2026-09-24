import { useRef, type PointerEvent } from 'react'
import { useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react'
import * as m from 'motion/react-m'
import { onRaf, reducedMotion } from '@/lib/motion'
import { ArtworkModel } from '@/features/model/ArtworkModel'
import type { FrameSource } from '@/features/model/useControllerRig'
import { DEMO_STILL, demoFrame } from './demoFrame'

// ponytail: module constants so the rig's effect keeps one subscription; a per-render closure would resubscribe every frame
const demo: FrameSource = (cb) => {
  const t0 = performance.now()
  return onRaf(() => cb(demoFrame((performance.now() - t0) / 1000)))
}
const still: FrameSource = (cb) => {
  cb(DEMO_STILL)
  return () => {}
}

/**
 * Hero render: the DualSense drawing on a pointer-tilted stage with three depth layers
 * (shadow behind, body, glare in front) moving at different rates. The artwork is one injected SVG, so
 * depth is layered around it rather than per part; the rig still animates caps, triggers and lit buttons.
 */
export function HeroArtwork() {
  // App override (`?motion=reduce`) or the OS setting: no tilt, no glare drift, frozen demo pose.
  const reduce = useReducedMotion() || reducedMotion()
  const stage = useRef<HTMLDivElement>(null)
  const px = useMotionValue(0)
  const py = useMotionValue(0)
  const sx = useSpring(px, { stiffness: 120, damping: 18, mass: 0.6 })
  const sy = useSpring(py, { stiffness: 120, damping: 18, mass: 0.6 })
  const rotateY = useTransform(sx, [-1, 1], [-14, 14])
  const rotateX = useTransform(sy, [-1, 1], [10, -10])
  const shadowX = useTransform(sx, [-1, 1], [18, -18])
  const shadowY = useTransform(sy, [-1, 1], [14, -14])
  const glareX = useTransform(sx, [-1, 1], ['-30%', '30%'])
  const glareY = useTransform(sy, [-1, 1], ['-30%', '30%'])
  const glareA = useTransform(sy, [-1, 0, 1], [0.35, 0.15, 0.05])

  const move = (e: PointerEvent<HTMLDivElement>) => {
    const r = stage.current?.getBoundingClientRect()
    if (!r) return
    px.set(((e.clientX - r.left) / r.width - 0.5) * 2)
    py.set(((e.clientY - r.top) / r.height - 0.5) * 2)
  }
  const leave = () => {
    px.set(0)
    py.set(0)
  }
  const off = reduce ? 0 : undefined
  return (
    <div
      ref={stage}
      className="hero-rig"
      onPointerMove={reduce ? undefined : move}
      onPointerLeave={leave}
    >
      <m.div className="hero-tilt" style={{ rotateX: off ?? rotateX, rotateY: off ?? rotateY }}>
        <m.div
          className="hero-shadow"
          aria-hidden
          style={{ x: off ?? shadowX, y: off ?? shadowY }}
        />
        <ArtworkModel kind="dualsense" hero source={reduce ? still : demo} />
        <m.div
          className="hero-glare"
          aria-hidden
          style={{ x: off ?? glareX, y: off ?? glareY, opacity: reduce ? 0.1 : glareA }}
        />
      </m.div>
      <svg width="0" height="0" aria-hidden style={{ position: 'absolute' }}>
        <defs>
          <filter id="hero-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="hero-cap-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
            <stop offset="1" stopColor="#fff" stopOpacity="0.05" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  )
}
