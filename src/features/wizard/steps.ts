import {
  BINS,
  ButtonTracker,
  circularity,
  drift,
  pollingRate,
  resolutionBits,
  type Point,
  type ScoreInput,
  type Verdict,
} from '@/core/analysis'
import type { Frame } from '@/core/gamepad/types'

export interface Row {
  label: string
  value: string
  tone?: Verdict
}
export interface StepOutcome {
  rows: Row[]
  metrics: Partial<ScoreInput>
}
export interface WizardStep {
  id: string
  title: string
  instructions: string
  maxMs: number
  feed(f: Frame): void
  /** 0..1; the step auto-finishes at 1 or at maxMs */
  progress(): number
  finish(): StepOutcome
}

const timed = (maxMs: number) => {
  let t0: number | null = null
  return {
    tick: (t: number) => {
      if (t0 === null) t0 = t
      return Math.min(1, (t - t0) / maxMs)
    },
  }
}

function driftStep(): WizardStep {
  const l: Point[] = []
  const r: Point[] = []
  const tm = timed(3000)
  let p = 0
  return {
    id: 'drift',
    title: 'Stick drift',
    instructions: 'Let go of both sticks and keep your hands off the controller.',
    maxMs: 3000,
    feed(f) {
      p = tm.tick(f.t)
      l.push({ x: f.axes[0] ?? 0, y: f.axes[1] ?? 0 })
      r.push({ x: f.axes[2] ?? 0, y: f.axes[3] ?? 0 })
    },
    progress: () => p,
    finish() {
      const dl = drift(l)
      const dr = drift(r)
      return {
        rows: [
          { label: 'Left drift', value: dl.magnitude.toFixed(4), tone: dl.verdict },
          { label: 'Right drift', value: dr.magnitude.toFixed(4), tone: dr.verdict },
        ],
        metrics: { driftMagnitude: Math.max(dl.magnitude, dr.magnitude) },
      }
    },
  }
}

function circleStep(side: 'left' | 'right'): WizardStep {
  const ax = side === 'left' ? 0 : 2
  const pts: Point[] = []
  const filled = new Uint8Array(BINS)
  let n = 0
  return {
    id: `circle-${side}`,
    title: `${side === 'left' ? 'Left' : 'Right'} stick circularity`,
    instructions: `Push the ${side} stick fully to the edge and roll it slowly all the way around, two or three laps.`,
    maxMs: 25000,
    feed(f) {
      const x = f.axes[ax] ?? 0
      const y = f.axes[ax + 1] ?? 0
      const r = Math.hypot(x, y)
      if (pts.length < 20000) pts.push({ x, y })
      if (r < 0.5) return
      const i = Math.floor(((Math.atan2(y, x) + Math.PI) / (2 * Math.PI)) * BINS) % BINS
      if (!filled[i]) {
        filled[i] = 1
        n++
      }
    },
    progress: () => Math.min(1, n / (BINS - 2)),
    finish() {
      const c = circularity(pts)
      return {
        rows: [
          {
            label: `${side} circularity error`,
            value: `${c.errorPct.toFixed(1)} %`,
            tone: c.verdict,
          },
          {
            label: `${side} coverage`,
            value: `${Math.round(c.coverage * 100)} %`,
            tone: c.coverage > 0.9 ? 'good' : 'ok',
          },
          ...(c.incompleteRange
            ? [{ label: `${side} range`, value: 'does not reach the edge', tone: 'bad' as Verdict }]
            : []),
        ],
        metrics: { circularityErrorPct: c.errorPct },
      }
    },
  }
}

function resolutionStep(): WizardStep {
  const vals: number[] = []
  const tm = timed(6000)
  let p = 0
  return {
    id: 'resolution',
    title: 'Stick resolution',
    instructions:
      'Move the left stick very slowly from the centre to the edge and back, in several directions.',
    maxMs: 6000,
    feed(f) {
      p = tm.tick(f.t)
      if (vals.length < 40000) vals.push(f.axes[0] ?? 0, f.axes[1] ?? 0)
    },
    progress: () => p,
    finish() {
      const r = resolutionBits(vals)
      return {
        rows: [
          {
            label: 'Effective resolution',
            value: r.bits ? `${r.bits}-bit` : 'unknown',
            tone: r.bits >= 8 ? 'good' : 'ok',
          },
        ],
        metrics: { resolutionBits: r.bits || 8 },
      }
    },
  }
}

function pollingStep(): WizardStep {
  const ts: number[] = []
  const tm = timed(4000)
  let p = 0
  let last = ''
  return {
    id: 'polling',
    title: 'Report rate',
    instructions: 'Wiggle both sticks vigorously for a few seconds.',
    maxMs: 4000,
    feed(f) {
      p = tm.tick(f.t)
      const key = f.axes.join(',')
      if (key !== last) {
        last = key
        ts.push(f.hwT || f.t)
      }
    },
    progress: () => p,
    finish() {
      const r = pollingRate(ts)
      return {
        rows: [
          {
            label: 'Report rate (browser-observed)',
            value: r.hz ? `${r.hz} Hz ± ${r.jitterMs.toFixed(1)} ms` : 'not enough data',
            tone: r.hz >= 120 ? 'good' : r.hz >= 55 ? 'ok' : 'bad',
          },
        ],
        metrics: { pollingHz: r.hz || 60 },
      }
    },
  }
}

function buttonsStep(): WizardStep {
  const tracker = new ButtonTracker()
  const seen = new Set<number>()
  return {
    id: 'buttons',
    title: 'Buttons',
    instructions:
      'Press every button once: face buttons, D-pad, bumpers, triggers, stick clicks, Select/Start, Home.',
    maxMs: 60000,
    feed(f) {
      f.buttons.forEach((b, i) => {
        tracker.feed(i, b.pressed, f.t)
        if (b.pressed && i < 17) seen.add(i)
      })
    },
    progress: () => seen.size / 17,
    finish() {
      const all = tracker.all()
      const chatter = all.reduce((a, b) => a + b.chatter, 0)
      const stuck = all.filter((b) => b.stuck).length
      return {
        rows: [
          {
            label: 'Buttons pressed',
            value: `${seen.size} / 17`,
            tone: seen.size >= 16 ? 'good' : 'ok',
          },
          { label: 'Chatter events', value: String(chatter), tone: chatter ? 'bad' : 'good' },
          ...(stuck
            ? [{ label: 'Stuck buttons', value: String(stuck), tone: 'bad' as Verdict }]
            : []),
        ],
        metrics: { chatterEvents: chatter, stuckButtons: stuck },
      }
    },
  }
}

export const buildSteps = (): WizardStep[] => [
  driftStep(),
  circleStep('left'),
  circleStep('right'),
  resolutionStep(),
  pollingStep(),
  buttonsStep(),
]

export const DEFAULT_METRICS: ScoreInput = {
  driftMagnitude: 0,
  circularityErrorPct: 0,
  resolutionBits: 8,
  pollingHz: 125,
  chatterEvents: 0,
  stuckButtons: 0,
}
