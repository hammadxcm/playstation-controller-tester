import { STD, STD_BUTTONS, type Frame, type StdButton } from '@/core/gamepad/types'

export type RigWrite =
  | { kind: 'on'; part: StdButton; on: boolean }
  | { kind: 'edge'; part: StdButton }
  | { kind: 'var'; part: 'l2' | 'r2'; value: number }
  | { kind: 'stick'; part: 'ls' | 'rs'; x: number; y: number }

const EPS = 0.002

/** Pure diff engine: remembers the last frame and emits only what changed. No DOM. */
export function createRig() {
  const pressed = new Array<boolean>(STD_BUTTONS.length).fill(false)
  const trig = [0, 0]
  const axes = [0, 0, 0, 0]
  let first = true
  return {
    diff(f: Frame): RigWrite[] {
      const out: RigWrite[] = []
      STD_BUTTONS.forEach((name, i) => {
        const on = !!f.buttons[i]?.pressed
        if (on !== pressed[i] || first) {
          out.push({ kind: 'on', part: name, on })
          if (on && !first) out.push({ kind: 'edge', part: name })
          pressed[i] = on
        }
      })
      const l2 = f.buttons[STD.l2]?.value ?? 0
      const r2 = f.buttons[STD.r2]?.value ?? 0
      if (Math.abs(l2 - trig[0]!) > EPS || first) { trig[0] = l2; out.push({ kind: 'var', part: 'l2', value: l2 }) }
      if (Math.abs(r2 - trig[1]!) > EPS || first) { trig[1] = r2; out.push({ kind: 'var', part: 'r2', value: r2 }) }
      for (const [part, ax] of [['ls', 0], ['rs', 2]] as const) {
        const x = f.axes[ax] ?? 0
        const y = f.axes[ax + 1] ?? 0
        if (Math.abs(x - axes[ax]!) > EPS || Math.abs(y - axes[ax + 1]!) > EPS || first) {
          axes[ax] = x
          axes[ax + 1] = y
          out.push({ kind: 'stick', part, x, y })
        }
      }
      first = false
      return out
    },
  }
}
