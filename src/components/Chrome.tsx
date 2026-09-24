import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence } from 'motion/react'
import * as m from 'motion/react-m'
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

const sheet = {
  initial: { opacity: 0, y: -8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.22, ease: [0.33, 1, 0.68, 1] as const },
}

/**
 * Top-bar items: inline on wide screens, behind a hamburger in a slide-down sheet on phones.
 * One set of children, no duplication: CSS switches the panel between `display: contents` and a sheet.
 */
export function TopBarMenu({ children }: { children: ReactNode }) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const id = useId()
  const btn = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    panel.current?.querySelector<HTMLElement>('button, select, a')?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setOpen(false)
      btn.current?.focus()
    }
    const onDown = (e: PointerEvent) => {
      if (!panel.current?.contains(e.target as Node) && !btn.current?.contains(e.target as Node))
        setOpen(false)
    }
    addEventListener('keydown', onKey)
    addEventListener('pointerdown', onDown)
    return () => {
      removeEventListener('keydown', onKey)
      removeEventListener('pointerdown', onDown)
    }
  }, [open])
  return (
    <>
      <button
        ref={btn}
        type="button"
        className="btn btn-sm menu-btn"
        aria-expanded={open}
        aria-controls={id}
        aria-label={t('nav.menu')}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="menu-icon" data-open={open} aria-hidden>
          <i />
          <i />
          <i />
        </span>
      </button>
      {/* wide: always rendered inline; narrow: the sheet, animated */}
      <div className="menu-inline">{children}</div>
      <AnimatePresence>
        {open && (
          <m.div
            key="sheet"
            ref={panel}
            id={id}
            className="menu-sheet"
            {...sheet}
            onClick={(e) => {
              if ((e.target as HTMLElement).closest('button:not([aria-haspopup])')) setOpen(false)
            }}
          >
            {children}
          </m.div>
        )}
      </AnimatePresence>
    </>
  )
}
