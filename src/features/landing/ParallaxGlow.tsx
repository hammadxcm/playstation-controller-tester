import { useRef } from 'react'
import { useScroll, useTransform } from 'motion/react'
import * as m from 'motion/react-m'
import { reducedMotion } from '@/lib/motion'

/** Section backlight that drifts slowly against scroll. Displacement only; disabled under reduced motion. */
export function ParallaxGlow({ range = 48 }: { range?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [-range, range])
  return (
    <m.div ref={ref} className="section-glow" aria-hidden style={{ y: reducedMotion() ? 0 : y }} />
  )
}
