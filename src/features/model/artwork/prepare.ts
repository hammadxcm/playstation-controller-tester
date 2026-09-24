import type { ArtworkSpec } from './specs'

export interface PreparedArtwork {
  viewBox: string
  width: number
  height: number
  /** inner SVG markup, classified and tagged for the rig */
  inner: string
  /** ids that received a data-part, for tests */
  tagged: Record<string, string>
}

function classify(el: Element, spec: ArtworkSpec, group: string | null): string {
  const id = el.id
  const style = el.getAttribute('style') ?? ''
  if (spec.style === 'stroke') {
    // Named elements are the outlines; unnamed ones are the glyphs drawn on them.
    if (id === 'ps') return 'm-ps'
    if (id || group?.endsWith('-icon')) return 'm-line'
    if (style.includes('fill:#f00')) return 'm-icon-fill'
    return 'm-icon'
  }
  if (group === 'Background') return id.startsWith('Active') || id === 'Touchpad' ? 'm-active' : 'm-ink'
  if (group === 'Cover') return id === 'Active_PS' ? 'm-active' : 'm-cap'
  if (id === 'TPPattern' || id.endsWith('Pattern')) return 'm-ink-soft'
  return 'm-ink'
}

/** Sanitise one of the drawings: drop placeholders and inline colours, add classes and rig hooks. */
export function prepareArtwork(svgText: string, spec: ArtworkSpec): PreparedArtwork {
  const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml')
  const svg = doc.documentElement
  const viewBox = svg.getAttribute('viewBox') ?? '0 0 100 100'
  const [, , w, h] = viewBox.split(/\s+/).map(Number)
  for (const id of spec.remove) doc.getElementById(id)?.remove()
  // Drawings are bundled and reviewed, but never trust markup you hand to innerHTML.
  doc.querySelectorAll('script, foreignObject, iframe, object, embed, use, image, a').forEach((el) => el.remove())
  doc.querySelectorAll('*').forEach((el) => {
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase()
      if (name.startsWith('on') || ((name === 'href' || name === 'xlink:href') && !attr.value.startsWith('#'))) el.removeAttribute(attr.name)
    }
  })

  const walk = (el: Element, group: string | null) => {
    for (const child of Array.from(el.children)) {
      const tag = child.tagName.toLowerCase()
      const nextGroup = tag === 'g' && (['Background', 'Main', 'Cover', 'Top', 'Back'].includes(child.id) || child.id.endsWith('-icon')) ? child.id : group
      if (tag !== 'g') {
        const cls = classify(child, spec, group)
        const style = child.getAttribute('style') ?? ''
        child.setAttribute('class', cls)
        child.removeAttribute('style')
        if (/fill-rule:nonzero/.test(style)) child.setAttribute('fill-rule', 'nonzero')
        if (/fill-opacity:0\.3/.test(style)) child.setAttribute('class', 'm-ink-soft')
      } else {
        child.removeAttribute('style')
      }
      walk(child, nextGroup)
    }
  }
  walk(svg, null)

  const tagged: Record<string, string> = {}
  const tag = (id: string, part: string) => {
    const el = doc.getElementById(id)
    if (!el) return
    el.setAttribute('data-part', part)
    tagged[id] = part
  }
  for (const [part, ids] of Object.entries(spec.parts)) for (const id of ids ?? []) tag(id, part)
  for (const [name, ids] of Object.entries(spec.extra)) for (const id of ids) tag(id, `x:${name}`)
  for (const [stick, s] of Object.entries(spec.sticks) as ['ls' | 'rs', ArtworkSpec['sticks']['ls']][]) {
    const cap = doc.getElementById(s.cap)
    if (!cap) continue
    let wrap: Element | null = s.wrap ? doc.getElementById(s.wrap) : null
    if (!wrap) {
      const g = doc.createElementNS('http://www.w3.org/2000/svg', 'g')
      cap.parentNode?.insertBefore(g, cap)
      g.appendChild(cap)
      wrap = g
    }
    wrap.setAttribute('data-part', stick)
    cap.setAttribute('data-sub', 'cap')
    cap.setAttribute('data-part', stick === 'ls' ? 'l3' : 'r3')
    tagged[s.cap] = stick === 'ls' ? 'l3' : 'r3'
  }
  return { viewBox, width: w ?? 100, height: h ?? 100, inner: svg.innerHTML, tagged }
}
