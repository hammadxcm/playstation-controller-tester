import { describe, expect, it } from 'vitest'
import type { Frame } from '@/core/gamepad/types'
import { createRig } from './rig'
import { ART_FILES } from './artwork/specs'
import { build, defaults, PARAMS, type Mode } from '@/features/pro/triggerParams'

const frame = (axes: number[], buttons: { pressed: boolean; value: number }[] = []): Frame => ({ index: 0, id: 'x', mapping: 'standard', t: 0, hwT: 0, axes, buttons: [...buttons, ...Array.from({ length: 18 - buttons.length }, () => ({ pressed: false, value: 0 }))] })

describe('rig branches', () => {
  it('handles frames with missing buttons and axes, and right-stick moves', () => {
    const rig = createRig()
    rig.diff({ index: 0, id: 'x', mapping: 'standard', t: 0, hwT: 0, axes: [], buttons: [] })
    const w = rig.diff(frame([0, 0, 0.5, 0.5]))
    expect(w).toContainEqual({ kind: 'stick', part: 'rs', x: 0.5, y: 0.5 })
    const w2 = rig.diff(frame([0, 0, 0.5, 0.6]))
    expect(w2.length).toBe(1)
  })
})

describe('artwork files', () => {
  it('lazy-loads every drawing', async () => {
    for (const load of Object.values(ART_FILES)) expect((await load()).default).toContain('<svg')
  })
})

describe('triggerParams', () => {
  it('builds every mode from its defaults', () => {
    for (const m of Object.keys(PARAMS) as Mode[]) {
      const b = build(m, defaults(m))
      expect(b.length).toBe(11)
      if (m === 'off') expect(b[0]).toBe(5)
    }
    expect(build('feedback', {})[0]).toBe(5)
  })
})
