import { describe, expect, it } from 'vitest'
import type { Frame } from '@/core/gamepad/types'
import { createRig } from './rig'

const frame = (over: Partial<Frame> = {}): Frame => ({
  index: 0, id: 'x', mapping: 'standard', t: 0, hwT: 0, axes: [0, 0, 0, 0],
  buttons: Array.from({ length: 18 }, () => ({ pressed: false, value: 0 })), ...over,
})

describe('rig', () => {
  it('writes everything on the first frame and nothing while idle', () => {
    const rig = createRig()
    expect(rig.diff(frame()).length).toBeGreaterThan(0)
    expect(rig.diff(frame())).toEqual([])
    expect(rig.diff(frame({ axes: [0.001, 0, 0, 0] }))).toEqual([])
  })
  it('emits on + edge once on press, on only on release', () => {
    const rig = createRig()
    rig.diff(frame())
    const b = frame().buttons.map((x) => ({ ...x }))
    b[0] = { pressed: true, value: 1 }
    expect(rig.diff(frame({ buttons: b }))).toEqual([{ kind: 'on', part: 'south', on: true }, { kind: 'edge', part: 'south' }])
    expect(rig.diff(frame({ buttons: b }))).toEqual([])
    expect(rig.diff(frame())).toEqual([{ kind: 'on', part: 'south', on: false }])
  })
  it('tracks trigger values and sticks', () => {
    const rig = createRig()
    rig.diff(frame())
    const b = frame().buttons.map((x) => ({ ...x }))
    b[7] = { pressed: true, value: 0.5 }
    const w = rig.diff(frame({ buttons: b, axes: [0.3, -0.2, 0, 0] }))
    expect(w).toContainEqual({ kind: 'var', part: 'r2', value: 0.5 })
    expect(w).toContainEqual({ kind: 'stick', part: 'ls', x: 0.3, y: -0.2 })
    expect(w.find((x) => x.kind === 'stick' && x.part === 'rs')).toBeUndefined()
  })
})
