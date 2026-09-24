import { Button } from '@/components/ui'
import { LANG_NAMES, LANGS, type LangSetting } from '@/i18n'
import { useT } from '@/i18n/useT'
import { useResolvedTheme } from '@/state/hooks'
import { useStore } from '@/state/store'

/** Ambient backdrop shared by the landing and the shell: three transform-only gradient blobs. */
export function Ambient() {
  return (
    <div className="ambient" aria-hidden>
      <i />
      <i />
      <i />
    </div>
  )
}

export function ThemeButton() {
  const t = useT()
  const theme = useResolvedTheme()
  const setSettings = useStore((s) => s.setSettings)
  return (
    <Button
      small
      onClick={() => setSettings({ theme: theme === 'dark' ? 'light' : 'dark' })}
      aria-label={t('nav.theme')}
      title={t('nav.theme')}
    >
      {theme === 'dark' ? '☀︎' : '☾'}
    </Button>
  )
}

export function LangPicker() {
  const t = useT()
  const lang = useStore((s) => s.settings.lang)
  const setSettings = useStore((s) => s.setSettings)
  return (
    <select
      className="select select-sm"
      value={lang}
      onChange={(e) => setSettings({ lang: e.target.value as LangSetting })}
      aria-label={t('nav.language')}
    >
      <option value="auto">{t('nav.auto')}</option>
      {LANGS.map((l) => (
        <option key={l} value={l} lang={l}>
          {LANG_NAMES[l]}
        </option>
      ))}
    </select>
  )
}

export function SkipLink() {
  const t = useT()
  return (
    <a className="skip-link" href="#content">
      {t('nav.skip')}
    </a>
  )
}
