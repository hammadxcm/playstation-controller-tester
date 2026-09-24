export interface StickTrace {
  points: { x: number; y: number }[]
  cur: { x: number; y: number }
}

const MAX_FADE = 240
const MAX_CONST = 6000

export function pushTrace(t: StickTrace, x: number, y: number, mode: 'fade' | 'constant' | 'none'): void {
  t.cur = { x, y }
  if (mode === 'none') return
  const p = t.points
  const last = p[p.length - 1]
  if (last && last.x === x && last.y === y) return
  p.push({ x, y })
  const cap = mode === 'fade' ? MAX_FADE : MAX_CONST
  if (p.length > cap) p.splice(0, p.length - cap)
}
