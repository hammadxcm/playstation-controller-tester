/** Theme resolution: user setting ('system' follows the OS) → concrete light/dark, applied to <html> and the theme-color meta. */
export type ThemeSetting = 'system' | 'light' | 'dark'
export type Theme = 'light' | 'dark'

/** Browser chrome colour per theme; must match `--bg` in index.css and public/theme.js. */
export const THEME_COLOR: Record<Theme, string> = { dark: '#0a0c11', light: '#eef1f7' }
const QUERY = '(prefers-color-scheme: dark)'

export const resolveTheme = (s: ThemeSetting, prefersDark: boolean): Theme =>
  s === 'system' ? (prefersDark ? 'dark' : 'light') : s

export const prefersDark = (): boolean =>
  typeof matchMedia === 'function' && matchMedia(QUERY).matches

export function applyTheme(t: Theme, doc: Document = document): void {
  doc.documentElement.dataset.theme = t
  const m = doc.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  if (m) m.content = THEME_COLOR[t]
}

/** Subscribe to OS theme changes. Returns unsubscribe; no-op where matchMedia is missing (tests, old engines). */
export function watchSystemTheme(cb: (dark: boolean) => void): () => void {
  if (typeof matchMedia !== 'function') return () => {}
  const mq = matchMedia(QUERY)
  const on = (e: { matches: boolean }) => cb(e.matches)
  mq.addEventListener('change', on)
  return () => mq.removeEventListener('change', on)
}
