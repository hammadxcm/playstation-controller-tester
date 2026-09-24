import * as fx from '@/core/hid/dualsense/triggerEffects'

export type Mode = 'off' | 'feedback' | 'weapon' | 'vibration' | 'bow' | 'galloping' | 'machine'
export interface Param {
  key: string
  label: string
  min: number
  max: number
  def: number
}

export const PARAMS: Record<Mode, Param[]> = {
  off: [],
  feedback: [
    { key: 'position', label: 'Start position', min: 0, max: 9, def: 2 },
    { key: 'strength', label: 'Strength', min: 1, max: 8, def: 6 },
  ],
  weapon: [
    { key: 'start', label: 'Start', min: 2, max: 7, def: 2 },
    { key: 'end', label: 'End', min: 3, max: 8, def: 5 },
    { key: 'strength', label: 'Strength', min: 1, max: 8, def: 8 },
  ],
  vibration: [
    { key: 'position', label: 'Start position', min: 0, max: 9, def: 3 },
    { key: 'amplitude', label: 'Amplitude', min: 1, max: 8, def: 6 },
    { key: 'frequency', label: 'Frequency (Hz)', min: 1, max: 255, def: 30 },
  ],
  bow: [
    { key: 'start', label: 'Start', min: 0, max: 8, def: 1 },
    { key: 'end', label: 'End', min: 1, max: 8, def: 6 },
    { key: 'strength', label: 'Strength', min: 1, max: 8, def: 4 },
    { key: 'snap', label: 'Snap force', min: 1, max: 8, def: 8 },
  ],
  galloping: [
    { key: 'start', label: 'Start', min: 0, max: 8, def: 0 },
    { key: 'end', label: 'End', min: 1, max: 9, def: 9 },
    { key: 'first', label: 'First foot', min: 0, max: 6, def: 2 },
    { key: 'second', label: 'Second foot', min: 1, max: 7, def: 5 },
    { key: 'frequency', label: 'Frequency (Hz)', min: 1, max: 255, def: 3 },
  ],
  machine: [
    { key: 'start', label: 'Start', min: 0, max: 8, def: 1 },
    { key: 'end', label: 'End', min: 1, max: 9, def: 9 },
    { key: 'ampA', label: 'Amplitude A', min: 0, max: 7, def: 7 },
    { key: 'ampB', label: 'Amplitude B', min: 0, max: 7, def: 1 },
    { key: 'frequency', label: 'Frequency (Hz)', min: 1, max: 255, def: 20 },
    { key: 'period', label: 'Period (×0.1 s)', min: 0, max: 255, def: 5 },
  ],
}

export const defaults = (m: Mode): Record<string, number> =>
  Object.fromEntries(PARAMS[m].map((p) => [p.key, p.def]))

export function build(m: Mode, v: Record<string, number>): Uint8Array {
  const g = (k: string) => v[k] ?? 0
  switch (m) {
    case 'feedback':
      return fx.feedback(g('position'), g('strength'))
    case 'weapon':
      return fx.weapon(g('start'), g('end'), g('strength'))
    case 'vibration':
      return fx.vibration(g('position'), g('amplitude'), g('frequency'))
    case 'bow':
      return fx.bow(g('start'), g('end'), g('strength'), g('snap'))
    case 'galloping':
      return fx.galloping(g('start'), g('end'), g('first'), g('second'), g('frequency'))
    case 'machine':
      return fx.machine(g('start'), g('end'), g('ampA'), g('ampB'), g('frequency'), g('period'))
    default:
      return fx.off()
  }
}
