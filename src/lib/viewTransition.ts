import { flushSync } from 'react-dom'
import { reducedMotion } from './motion'

type VTDocument = Document & {
  startViewTransition?: (cb: () => void) => { finished: Promise<void> }
}

/** Run a state update inside a same-document view transition when available. */
export function transition(update: () => void, dir: 'fwd' | 'back' = 'fwd'): Promise<void> {
  const doc = document as VTDocument
  if (reducedMotion() || typeof doc.startViewTransition !== 'function') {
    update()
    return Promise.resolve()
  }
  document.documentElement.dataset.dir = dir
  return doc.startViewTransition(() => flushSync(update)).finished.catch(() => undefined)
}
