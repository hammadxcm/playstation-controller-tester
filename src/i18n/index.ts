/** Tiny i18n: typed dictionaries, prefix-matched language negotiation, `{var}` interpolation. No dependency. */
import { en } from './en'

export const LANGS = ['en', 'es', 'pt', 'fr', 'de', 'ru', 'ja', 'zh', 'ko'] as const
export type Lang = (typeof LANGS)[number]
export type LangSetting = 'auto' | Lang

/** Native names for the picker. */
export const LANG_NAMES: Record<Lang, string> = {
  en: 'English',
  es: 'Español',
  pt: 'Português',
  fr: 'Français',
  de: 'Deutsch',
  ru: 'Русский',
  ja: '日本語',
  zh: '中文',
  ko: '한국어',
}

type Leaves<T> = {
  [K in keyof T]: T[K] extends string
    ? string
    : T[K] extends readonly string[]
      ? readonly string[]
      : Leaves<T[K]>
}
export type Dict = Leaves<typeof en>

/** 'auto' follows the browser's preference list; `pt-BR` matches `pt`, `zh-Hant` matches `zh`. Falls back to English. */
export function resolveLang(setting: LangSetting, preferred: readonly string[]): Lang {
  if (setting !== 'auto') return setting
  for (const p of preferred) {
    const base = p.toLowerCase().split('-')[0] as Lang
    if ((LANGS as readonly string[]).includes(base)) return base
  }
  return 'en'
}

/** `{name}` placeholders. Unknown placeholders are left in place so a typo shows up in the UI. */
export const format = (s: string, vars?: Record<string, string | number>): string =>
  vars ? s.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m)) : s

/** Walk `a.b.c` through a dictionary; `undefined` when any segment is missing. */
export function lookup(dict: unknown, path: string): unknown {
  let cur = dict
  for (const k of path.split('.')) {
    if (cur === null || typeof cur !== 'object' || !(k in cur)) return undefined
    cur = (cur as Record<string, unknown>)[k]
  }
  return cur
}

/** Translate against `dict`, falling back to English key by key so a partial dictionary never shows blanks. */
export function translate(
  dict: Dict,
  path: string,
  vars?: Record<string, string | number>,
): string {
  const v = lookup(dict, path) ?? lookup(en, path)
  return typeof v === 'string' ? format(v, vars) : path
}
