import { STD_AXES, STD_BUTTONS, type Frame, type StdButton } from './types'

/** A user-learned layout for pads with mapping === "". -1 = unassigned. */
export interface Layout {
  buttons: Record<StdButton, number>
  axes: Record<(typeof STD_AXES)[number], number>
}

export function emptyLayout(): Layout {
  return {
    buttons: Object.fromEntries(STD_BUTTONS.map((b) => [b, -1])) as Layout['buttons'],
    axes: { lx: -1, ly: -1, rx: -1, ry: -1 },
  }
}

// ponytail: keyed by base path because every project on a github.io account shares one origin
const KEY = `ct${import.meta.env.BASE_URL}layouts`

function load(): Record<string, Layout> {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}')
  } catch {
    return {}
  }
}

export function getLayout(id: string): Layout | undefined {
  return load()[id]
}

export function saveLayout(id: string, layout: Layout): void {
  const all = load()
  all[id] = layout
  localStorage.setItem(KEY, JSON.stringify(all))
}

export function deleteLayout(id: string): void {
  const all = load()
  delete all[id]
  localStorage.setItem(KEY, JSON.stringify(all))
}

/** Re-shape a raw frame into standard order. Standard-mapped frames pass through untouched. */
export function applyLayout(frame: Frame, layout?: Layout): Frame {
  if (frame.mapping === 'standard' || !layout) return frame
  const off = { pressed: false, value: 0 }
  return {
    ...frame,
    mapping: 'learned',
    buttons: STD_BUTTONS.map((b) => frame.buttons[layout.buttons[b]] ?? off),
    axes: STD_AXES.map((a) => frame.axes[layout.axes[a]] ?? 0),
  }
}
