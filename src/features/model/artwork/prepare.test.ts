// @vitest-environment jsdom
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { describe, expect, it } from 'vitest'
import { STD_BUTTONS } from '@/core/gamepad/types'
import { prepareArtwork } from './prepare'
import { SPECS, type ArtworkKind } from './specs'

const load = (k: ArtworkKind) => readFileSync(resolve('src/features/model/artwork', `${k}.svg`), 'utf8')

describe('prepareArtwork', () => {
  for (const kind of Object.keys(SPECS) as ArtworkKind[]) {
    it(`${kind}: tags every standard button, strips inline colours, wraps stick caps`, () => {
      const out = prepareArtwork(load(kind), SPECS[kind])
      const parts = new Set(Object.values(out.tagged))
      for (const b of STD_BUTTONS) expect(parts.has(b), `${kind} missing ${b}`).toBe(true)
      expect(out.inner).not.toMatch(/style="/)
      expect(out.inner).not.toContain('#f00')
      expect(out.inner).toMatch(/data-part="ls"[^>]*>[\s\S]*data-sub="cap"/)
      expect(out.width).toBeGreaterThan(1000)
      for (const id of SPECS[kind].remove) expect(out.inner).not.toContain(`id="${id}"`)
    })
  }
  it('classifies stroke art icons and fill art active shapes', () => {
    const ds = prepareArtwork(load('dualsense'), SPECS.dualsense)
    expect(ds.inner).toContain('class="m-icon"')
    expect(ds.inner).toContain('class="m-ps"')
    expect(ds.inner).toContain('class="m-icon-fill"')
    const ds4 = prepareArtwork(load('dualshock4'), SPECS.dualshock4)
    expect(ds4.inner).toContain('class="m-active"')
    expect(ds4.inner).toContain('class="m-ink-soft"')
    expect(ds4.inner).toContain('class="m-cap"')
    expect(ds4.inner).toContain('fill-rule="nonzero"')
  })
  it('survives a missing element in the spec', () => {
    const out = prepareArtwork('<svg viewBox="0 0 10 10"><g id="Main"><path id="a"/></g></svg>', { ...SPECS.dualshock4, parts: { south: ['nope'] }, sticks: { ls: { cap: 'nope' }, rs: { cap: 'nope' } } })
    expect(out.tagged).toEqual({})
    expect(out.inner).toContain('class="m-ink"')
  })
})
