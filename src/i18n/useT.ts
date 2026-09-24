import { useCallback, useEffect } from 'react'
import { useStore } from '@/state/store'
import { DICTS } from './dicts'
import { lookup, resolveLang, translate, type Lang } from './index'

/** Current language from the persisted setting ('auto' follows the browser). */
export const useLang = (): Lang =>
  resolveLang(
    useStore((s) => s.settings.lang),
    typeof navigator !== 'undefined' ? navigator.languages : [],
  )

/** `t('hero.title')`, `t('add.noGamepad', { engine })`, and `t.list('showcase.dualsense.facts')` for string arrays. */
export function useT() {
  const lang = useLang()
  const dict = DICTS[lang]
  const t = useCallback(
    (path: string, vars?: Record<string, string | number>) => translate(dict, path, vars),
    [dict],
  )
  const list = useCallback(
    (path: string): readonly string[] =>
      (lookup(dict, path) as readonly string[] | undefined) ??
      (lookup(DICTS.en, path) as readonly string[]),
    [dict],
  )
  return Object.assign(t, { list, lang })
}

/** Keeps <html lang>, the title and the description in step with the current language. */
export function useDocumentLang(): void {
  const t = useT()
  useEffect(() => {
    document.documentElement.lang = t.lang
    document.title = t('app.tabTitle')
    document
      .querySelector<HTMLMetaElement>('meta[name="description"]')
      ?.setAttribute('content', t('app.description'))
  }, [t])
}
