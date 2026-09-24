// Pre-paint theme: mirrors src/lib/theme.ts so a light-theme visitor never sees a dark flash.
// Plain script (CSP script-src 'self'); the storage key is `ct<base>settings`, same as src/state/store.ts.
;(function () {
  const src = (document.currentScript && document.currentScript.src) || '/'
  const base = src.replace(/^https?:\/\/[^/]+/, '').replace(/theme\.js.*$/, '') || '/'
  let theme = 'system'
  try {
    const raw = localStorage.getItem('ct' + base + 'settings')
    const saved = raw && JSON.parse(raw).state.settings.theme
    if (saved === 'light' || saved === 'dark') theme = saved
  } catch {
    /* no storage: fall through to the OS preference */
  }
  if (theme === 'system') theme = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  document.documentElement.dataset.theme = theme
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.content = theme === 'dark' ? '#0a0c11' : '#eef1f7'
})()
