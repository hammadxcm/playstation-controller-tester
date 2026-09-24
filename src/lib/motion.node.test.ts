import { describe, expect, it } from 'vitest'
import { reducedMotion, smooth } from './motion'

describe('motion outside a browser', () => {
  it('defaults to full motion without location, document or matchMedia', () => {
    expect(reducedMotion()).toBe(false)
    expect(smooth(0, 2, 0.25)).toBe(0.5)
  })
})
