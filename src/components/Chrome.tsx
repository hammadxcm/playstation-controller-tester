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

/** The Deadzone mark: Iconoir "gamepad" (MIT, © 2021 Luca Burgio), drawn in the current text colour. */
export function BrandMark() {
  return (
    <svg
      className="brand-mark"
      viewBox="0 0 24 24"
      width="22"
      height="22"
      aria-hidden
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17.5 17.5C20 21 23.9486 18.4151 23 15C21.5753 9.87113 20.8001 7.01556 20.3969 5.50793C20.1597 4.62136 19.3562 4 18.4384 4L5.56155 4C4.64382 4 3.844 4.62481 3.62085 5.515C2.7815 8.86349 2.0326 11.8016 1.14415 15C0.195501 18.4151 4.14415 21 6.64415 17.5" />
      <path d="M18 8.5L18.0111 8.51M16.49 7L16.5011 7.01M16.49 10L16.5011 10.01M15 8.5L15.0111 8.51M7 7V10M5.5 8.5H8.5" />
      <circle cx="8" cy="14" r="2" />
      <circle cx="16" cy="14" r="2" />
    </svg>
  )
}

export const REPO = 'https://github.com/hammadxcm/playstation-controller-tester'
const AUTHOR = {
  name: 'Hammad Khan',
  github: 'https://github.com/hammadxcm',
  portfolio: 'https://hk.fyniti.co.uk',
  site: 'https://fyniti.co.uk',
}

/** GitHub repo link for the top bar (rides inside the hamburger sheet on phones). */
export function RepoLink() {
  return (
    <a
      className="btn btn-sm repo-link"
      href={REPO}
      rel="noopener"
      target="_blank"
      aria-label="GitHub repository"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden fill="currentColor">
        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
      </svg>
      GitHub
    </a>
  )
}

/** Author links for both footers. */
export function SiteLinks() {
  const t = useT()
  return (
    <span className="site-links">
      <span>
        {t('footer.by')}{' '}
        <a href={AUTHOR.github} rel="noopener me" target="_blank">
          {AUTHOR.name}
        </a>
      </span>
      <a href={AUTHOR.portfolio} rel="noopener me" target="_blank">
        {t('footer.portfolio')}
      </a>
      <a href={AUTHOR.site} rel="noopener me" target="_blank">
        {t('footer.site')}
      </a>
    </span>
  )
}
