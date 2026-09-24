import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { LazyMotion, MotionConfig, domAnimation } from 'motion/react'
import App from './App'
import '@fontsource/manrope/700.css'
import '@fontsource/manrope/800.css'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/500.css'
import './index.css'
import { reducedMotion } from '@/lib/motion'

if (import.meta.env.DEV && new URLSearchParams(location.search).has('mock'))
  await import('./testing/mock')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* ponytail: `m.*` + domAnimation (~20 kB) instead of the 34 kB `motion` component; `strict` throws if anyone imports it. `?motion=reduce` (lib/motion) forces reduced motion for Motion too. */}
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion={reducedMotion() ? 'always' : 'user'}>
        <App />
      </MotionConfig>
    </LazyMotion>
  </StrictMode>,
)
