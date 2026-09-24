export interface ButtonStats {
  presses: number
  chatter: number
  longestHoldMs: number
  stuck: boolean
  down: boolean
}

const CHATTER_MS = 20
const STUCK_MS = 10_000

/** Stateful per-button tracker. Feed (index, pressed, t) each frame. */
export class ButtonTracker {
  private stats: ButtonStats[] = []
  private downAt: number[] = []
  private upAt: number[] = []

  feed(i: number, pressed: boolean, t: number): void {
    const s = (this.stats[i] ??= { presses: 0, chatter: 0, longestHoldMs: 0, stuck: false, down: false })
    if (pressed && !s.down) {
      s.presses++
      if (t - (this.upAt[i] ?? -Infinity) < CHATTER_MS) s.chatter++
      this.downAt[i] = t
    } else if (!pressed && s.down) {
      s.longestHoldMs = Math.max(s.longestHoldMs, t - this.downAt[i]!)
      this.upAt[i] = t
      s.stuck = false
    }
    if (pressed && t - this.downAt[i]! > STUCK_MS) s.stuck = true
    s.down = pressed
  }

  get(i: number): ButtonStats | undefined {
    return this.stats[i]
  }
  all(): ButtonStats[] {
    return this.stats
  }
  reset(): void {
    this.stats = []
    this.downAt = []
    this.upAt = []
  }
}
