/** Tab id ↔ URL hash, so `#pro` and `#report` deep-link straight into the shell. */
export const readTab = <T extends string>(hash: string, ids: readonly T[], fallback: T): T => {
  const id = hash.replace(/^#/, '')
  return (ids as readonly string[]).includes(id) ? (id as T) : fallback
}
export const tabHash = (id: string): string => `#${id}`
