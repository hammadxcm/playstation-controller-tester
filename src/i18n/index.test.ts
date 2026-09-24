import { describe, expect, it } from 'vitest'
import { format, LANG_NAMES, LANGS, lookup, resolveLang, translate, type Dict } from './index'
import { en } from './en'
import { DICTS } from './dicts'

describe('i18n', () => {
  it('negotiates a language from the browser list with prefix matching', () => {
    expect(resolveLang('auto', ['pt-BR', 'en-US'])).toBe('pt')
    expect(resolveLang('auto', ['zh-Hant-TW'])).toBe('zh')
    expect(resolveLang('auto', ['xx', 'JA'])).toBe('ja')
    expect(resolveLang('auto', ['xx'])).toBe('en')
    expect(resolveLang('auto', [])).toBe('en')
    expect(resolveLang('ko', ['en'])).toBe('ko')
  })
  it('interpolates named placeholders and leaves unknown ones visible', () => {
    expect(format('Hi {name}, {n}', { name: 'A', n: 2 })).toBe('Hi A, 2')
    expect(format('Hi {name}', {})).toBe('Hi {name}')
    expect(format('plain')).toBe('plain')
  })
  it('looks up dotted paths and translates with English fallback', () => {
    expect(lookup(en, 'nav.proMode')).toBe(en.nav.proMode)
    expect(lookup(en, 'nav.missing')).toBeUndefined()
    expect(lookup(en, 'nav.proMode.deeper')).toBeUndefined()
    expect(lookup(null, 'x')).toBeUndefined()
    const partial = { ...en, nav: { ...en.nav, proMode: 'Modo Pro' } } as Dict
    expect(translate(partial, 'nav.proMode')).toBe('Modo Pro')
    expect(translate({} as Dict, 'nav.proMode')).toBe(en.nav.proMode)
    expect(translate(en, 'nope.nope')).toBe('nope.nope')
    expect(translate(en, 'add.noGamepad', { engine: 'X' })).toContain('X')
  })
  it('ships every language with the same key set as English', () => {
    const keys = (o: unknown, p = ''): string[] =>
      o && typeof o === 'object' && !Array.isArray(o)
        ? Object.entries(o).flatMap(([k, v]) => keys(v, p ? `${p}.${k}` : k))
        : [p]
    const ref = keys(en).sort()
    for (const l of LANGS) {
      expect(LANG_NAMES[l]).toBeTruthy()
      expect(keys(DICTS[l]).sort(), l).toEqual(ref)
    }
  })
})
