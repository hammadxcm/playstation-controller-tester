import type { Frame } from './types'

type FrameListener = (frames: Frame[]) => void
type PadsListener = (pads: Pick<Frame, 'index' | 'id' | 'mapping'>[]) => void

export function snapshot(gp: Gamepad, t: number): Frame {
  return {
    index: gp.index,
    id: gp.id,
    mapping: gp.mapping,
    t,
    hwT: gp.timestamp ?? 0,
    axes: Array.from(gp.axes),
    buttons: gp.buttons.map((b) => ({ pressed: b.pressed, value: b.value })),
  }
}

function readAll(): Frame[] {
  const t = performance.now()
  const out: Frame[] = []
  for (const gp of navigator.getGamepads()) if (gp) out.push(snapshot(gp, t))
  return out
}

const frameListeners = new Set<FrameListener>()
const padsListeners = new Set<PadsListener>()
let raf = 0
let lastKey = ''

function tick() {
  const frames = readAll()
  const key = frames.map((f) => `${f.index}:${f.id}`).join('|')
  if (key !== lastKey) {
    lastKey = key
    const pads = frames.map(({ index, id, mapping }) => ({ index, id, mapping }))
    padsListeners.forEach((l) => l(pads))
  }
  frameListeners.forEach((l) => l(frames))
  raf = requestAnimationFrame(tick)
}

function ensureRunning() {
  if (!raf) raf = requestAnimationFrame(tick)
}
function maybeStop() {
  if (raf && !frameListeners.size && !padsListeners.size) {
    cancelAnimationFrame(raf)
    raf = 0
    lastKey = ''
  }
}

/** Subscribe to every animation frame. Hot path: keep callbacks cheap, no React state. */
export function onFrames(cb: FrameListener): () => void {
  frameListeners.add(cb)
  ensureRunning()
  return () => {
    frameListeners.delete(cb)
    maybeStop()
  }
}

/** Fires only when the set of connected pads changes. Safe to push into React state. */
export function onPads(cb: PadsListener): () => void {
  padsListeners.add(cb)
  ensureRunning()
  return () => {
    padsListeners.delete(cb)
    maybeStop()
  }
}

export function getGamepad(index: number): Gamepad | null {
  return navigator.getGamepads()[index] ?? null
}
