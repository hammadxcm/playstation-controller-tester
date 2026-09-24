// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { applyTheme, prefersDark, resolveTheme, THEME_COLOR, watchSystemTheme } from './theme'

afterEach(() => vi.unstubAllGlobals())

describe('theme', () => {
  it('resolves system to the OS preference and explicit values to themselves', () => {
    expect(resolveTheme('system', true)).toBe('dark')
    expect(resolveTheme('system', false)).toBe('light')
    expect(resolveTheme('light', true)).toBe('light')
    expect(resolveTheme('dark', false)).toBe('dark')
  })
  it('reads prefers-color-scheme and tolerates a missing matchMedia', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }))
    expect(prefersDark()).toBe(true)
    vi.stubGlobal('matchMedia', undefined)
    expect(prefersDark()).toBe(false)
  })
  it('applies data-theme and the theme-color meta when present', () => {
    applyTheme('light')
    expect(document.documentElement.dataset.theme).toBe('light')
    const m = document.createElement('meta')
    m.name = 'theme-color'
    document.head.appendChild(m)
    applyTheme('dark')
    expect(m.content).toBe(THEME_COLOR.dark)
    m.remove()
  })
  it('watches the media query and unsubscribes', () => {
    let listener: ((e: { matches: boolean }) => void) | null = null
    const remove = vi.fn()
    vi.stubGlobal('matchMedia', () => ({
      matches: false,
      addEventListener: (_: string, cb: (e: { matches: boolean }) => void) => {
        listener = cb
      },
      removeEventListener: remove,
    }))
    const cb = vi.fn()
    const off = watchSystemTheme(cb)
    listener!({ matches: true })
    expect(cb).toHaveBeenCalledWith(true)
    off()
    expect(remove).toHaveBeenCalled()
    vi.stubGlobal('matchMedia', undefined)
    expect(watchSystemTheme(cb)).toBeTypeOf('function')
    watchSystemTheme(cb)()
  })
})
